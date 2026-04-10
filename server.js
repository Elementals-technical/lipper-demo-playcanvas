const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const axios = require('axios').default;
const multer = require('multer');

const app = express();

const PORT = process.env.PORT || 80;
const POSTMARK_TOKEN = process.env.POSTMARK_TOKEN;

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded());

app.get('/api/health', (req, res) => {
  res.status(200).send({ message: 'server healthy!' });
});

app.post('/api/email', async (req, res) => {
  const data = req.body;
  const response = await axios.post(
    'https://api.postmarkapp.com/email/withTemplate/',
    data,
    {
      headers: { 'X-Postmark-Server-Token': POSTMARK_TOKEN },
    }
  );
  if (response.status !== 200)
    res.status(500).json({ message: 'error connecting to postmark' });
  res.status(200).send(response.data);
});

// ── AR local storage ──
const AR_MODELS_DIR = path.join(__dirname, 'ar-models');
if (!fs.existsSync(AR_MODELS_DIR)) fs.mkdirSync(AR_MODELS_DIR, { recursive: true });

let arIdCounter = 0;
try {
  const existing = fs.readdirSync(AR_MODELS_DIR).filter((f) => f.endsWith('.json'));
  if (existing.length > 0) {
    arIdCounter = Math.max(...existing.map((f) => parseInt(f, 10) || 0));
  }
} catch {}

// Lazy ESM imports — @gltf-transform is ESM-only, server.js is CJS
let _gltfModules = null;
let _dracoModules = null;
async function getGltfModules() {
  if (!_gltfModules) {
    const [core, ext, fn, draco3d, sharpMod] = await Promise.all([
      import('@gltf-transform/core'),
      import('@gltf-transform/extensions'),
      import('@gltf-transform/functions'),
      import('draco3dgltf'),
      import('sharp'),
    ]);
    _gltfModules = {
      core,
      ext,
      fn,
      draco3d: draco3d.default || draco3d,
      sharp: sharpMod.default || sharpMod,
    };
  }
  return _gltfModules;
}
async function getDracoModules() {
  if (!_dracoModules) {
    const { draco3d } = await getGltfModules();
    const encoder = await draco3d.createEncoderModule();
    const decoder = await draco3d.createDecoderModule();
    _dracoModules = { encoder, decoder };
  }
  return _dracoModules;
}

async function optimizeGlb(input) {
  const SKIP_MB = 5;
  const inputMB = input.byteLength / 1024 / 1024;
  if (inputMB < SKIP_MB) {
    console.log(`[AR]   GLB ${inputMB.toFixed(2)} MB < ${SKIP_MB} MB — skipping`);
    return input;
  }
  const { core, ext, fn, sharp } = await getGltfModules();
  const { encoder, decoder } = await getDracoModules();

  const io = new core.NodeIO()
    .registerExtensions([
      ext.KHRDracoMeshCompression,
      ext.KHRTextureBasisu,
      ext.KHRMaterialsUnlit,
      ext.KHRMaterialsClearcoat,
      ext.KHRMaterialsIOR,
      ext.KHRMaterialsSpecular,
      ext.KHRMaterialsTransmission,
      ext.KHRMaterialsVolume,
      ext.KHRMaterialsSheen,
      ext.KHRMeshQuantization,
      ext.KHRTextureTransform,
      ext.EXTTextureWebP,
    ])
    .registerDependencies({
      'draco3d.encoder': encoder,
      'draco3d.decoder': decoder,
    });

  const document = await io.readBinary(new Uint8Array(input));

  // Fix negative scale nodes — bake into vertices, required for Android Scene Viewer
  const negScaleNodes = document
    .getRoot()
    .listNodes()
    .filter((node) => {
      const s = node.getScale();
      return s[0] < 0 || s[1] < 0 || s[2] < 0;
    });
  if (negScaleNodes.length > 0) {
    console.log(`[AR]   Fixing ${negScaleNodes.length} nodes with negative scale...`);
    for (const node of negScaleNodes) fn.clearNodeTransform(node);
  }

  await document.transform(
    fn.textureCompress({ encoder: sharp, targetFormat: 'webp', quality: 95 })
  );

  const output = await io.writeBinary(document);
  console.log(
    `[AR]   GLB optimised: ${inputMB.toFixed(2)} MB → ${(output.byteLength / 1024 / 1024).toFixed(2)} MB`
  );
  return Buffer.from(output);
}

const arUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
});

app.post(
  '/api/ar/upload',
  arUpload.fields([
    { name: 'glb', maxCount: 1 },
    { name: 'usdz', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const glbBuffer = req.files?.glb?.[0]?.buffer;
      const usdzBuffer = req.files?.usdz?.[0]?.buffer;
      if (!glbBuffer || !usdzBuffer) {
        return res.status(400).json({ error: 'Missing glb or usdz file' });
      }
      const configuration = req.body?.configuration ?? '{}';

      const totalStart = Date.now();
      console.log(
        `[AR] Parse files (GLB: ${(glbBuffer.byteLength / 1024 / 1024).toFixed(2)} MB, USDZ: ${(usdzBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`
      );

      // Step 1: GLB optimisation
      const optimizedGlb = await optimizeGlb(glbBuffer);
      // Step 2: USDZ pass-through (optimisation disabled)
      const optimizedUsdz = usdzBuffer;

      // Step 3: Save to disk
      const id = ++arIdCounter;
      fs.writeFileSync(path.join(AR_MODELS_DIR, `${id}.glb`), optimizedGlb);
      fs.writeFileSync(path.join(AR_MODELS_DIR, `${id}.usdz`), optimizedUsdz);
      fs.writeFileSync(
        path.join(AR_MODELS_DIR, `${id}.json`),
        JSON.stringify({
          id,
          configuration: JSON.parse(configuration),
          createdAt: new Date().toISOString(),
        })
      );

      console.log(`[AR] id:${id} saved in ${Date.now() - totalStart}ms`);
      res.json({ id });
    } catch (err) {
      console.error('[AR] Upload/optimize failed:', err);
      res.status(500).json({ error: 'AR upload failed' });
    }
  }
);

app.get('/ar/models/:id/model.glb', (req, res) => {
  const filePath = path.join(AR_MODELS_DIR, `${req.params.id}.glb`);
  if (!fs.existsSync(filePath)) return res.status(404).send('GLB not found');
  res.set({
    'Content-Type': 'model/gltf-binary',
    'Cache-Control': 'public, max-age=3600',
  });
  res.sendFile(filePath);
});

app.get('/ar/usdz/:id/model.usdz', (req, res) => {
  const filePath = path.join(AR_MODELS_DIR, `${req.params.id}.usdz`);
  if (!fs.existsSync(filePath)) return res.status(404).send('USDZ not found');
  res.set({
    'Content-Type': 'model/vnd.usdz+zip',
    'Content-Disposition': `inline; filename="model_${req.params.id}.usdz"`,
    'Cache-Control': 'public, max-age=3600',
  });
  res.sendFile(filePath);
});

app.get('/ar/view/:id', (req, res) => {
  const id = req.params.id;
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);

  const configPath = path.join(AR_MODELS_DIR, `${id}.json`);
  if (!fs.existsSync(configPath)) return res.status(404).send('AR configuration not found');

  const glbPath = path.join(AR_MODELS_DIR, `${id}.glb`);
  const usdzPath = path.join(AR_MODELS_DIR, `${id}.usdz`);
  const glbSize = fs.existsSync(glbPath)
    ? (fs.statSync(glbPath).size / 1024 / 1024).toFixed(2)
    : '—';
  const usdzSize = fs.existsSync(usdzPath)
    ? (fs.statSync(usdzPath).size / 1024 / 1024).toFixed(2)
    : '—';

  const glbUrl = `/ar/models/${id}/model.glb`;
  const usdzUrl = `/ar/usdz/${id}/model.usdz`;

  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const absGlbUrl = `${proto}://${host}${glbUrl}`;
  const sceneViewerUrl =
    `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(absGlbUrl)}&mode=ar_preferred` +
    `#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;` +
    `S.browser_fallback_url=${encodeURIComponent('https://play.google.com/store/apps/details?id=com.google.ar.core')};end;`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>View in AR</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; background: #f5f5f7; color: #1d1d1f;
      text-align: center; padding: 20px;
    }
    .container { max-width: 400px; }
    h1 { font-size: 22px; font-weight: 600; margin-bottom: 12px; }
    p { font-size: 14px; color: #6e6e73; margin-bottom: 24px; line-height: 1.5; }
    .spinner {
      width: 40px; height: 40px; border: 3px solid #e0e0e0;
      border-top-color: #2c2c2c; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto 20px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ar-btn {
      display: inline-block; padding: 14px 32px; background: #2c2c2c;
      color: #fff; text-decoration: none; border-radius: 12px;
      font-size: 16px; font-weight: 600; margin-top: 16px; border: none; cursor: pointer;
    }
    .download-btn {
      display: inline-block; padding: 12px 28px; background: transparent;
      color: #2c2c2c; text-decoration: none; border-radius: 12px; border: 1px solid #2c2c2c;
      font-size: 14px; font-weight: 600; margin-top: 12px; cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner" id="spinner"></div>
    <h1>Opening AR…</h1>
    <p>Your model is loading in Augmented Reality</p>

    ${isIOS ? `
    <a class="ar-btn" id="ar-link" rel="ar" href="${usdzUrl}" style="display:none">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" style="width:1px;height:1px">
      Open in AR
    </a>
    <a class="download-btn" id="download-usdz" href="${usdzUrl}" download="model_${id}.usdz" style="display:none">
      Download USDZ (${usdzSize} MB)
    </a>
    <script>
      var link = document.getElementById('ar-link');
      var dlBtn = document.getElementById('download-usdz');
      setTimeout(function() {
        link.click();
        setTimeout(function() {
          document.getElementById('spinner').style.display = 'none';
          document.querySelector('h1').textContent = 'View in AR';
          document.querySelector('p').textContent = 'Tap to open in AR or download the model';
          link.style.display = 'inline-block';
          dlBtn.style.display = 'inline-block';
        }, 2000);
      }, 500);
    </script>
    ` : ''}

    ${isAndroid ? `
    <a class="download-btn" id="download-glb" href="${glbUrl}" download="model_${id}.glb" style="display:none">
      Download GLB (${glbSize} MB)
    </a>
    <script>
      setTimeout(function() {
        window.location.href = "${sceneViewerUrl}";
        setTimeout(function() {
          document.getElementById('spinner').style.display = 'none';
          document.querySelector('h1').textContent = 'View in AR';
          document.querySelector('p').textContent = 'Tap to open in AR or download the model';
          var btn = document.createElement('a');
          btn.className = 'ar-btn';
          btn.href = '${sceneViewerUrl}';
          btn.textContent = 'Open in AR';
          document.querySelector('.container').appendChild(btn);
          document.getElementById('download-glb').style.display = 'inline-block';
        }, 3000);
      }, 500);
    </script>
    ` : ''}

    ${!isIOS && !isAndroid ? `
    <script>
      document.getElementById('spinner').style.display = 'none';
      document.querySelector('h1').textContent = 'Download 3D Model';
      document.querySelector('p').textContent = 'Open this link on iOS or Android to view in AR, or download the model below.';
    </script>
    <a class="download-btn" href="${glbUrl}" download="model_${id}.glb">Download GLB (${glbSize} MB)</a>
    <a class="download-btn" href="${usdzUrl}" download="model_${id}.usdz">Download USDZ (${usdzSize} MB)</a>
    ` : ''}
  </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.use('/', (req, res, next) => {
  const env = req.subdomains[0] || 'dev';
  req.url = `/${env}${req.originalUrl}`;
  next();
});

app.use(express.static(path.join(__dirname, 'build')));

app.listen(PORT, () => console.log('listening on port: ', PORT));
