const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

/** Runs the real TypeScript modules with isolated caches and explicit offline dependencies. */
function loadModule(file, dependencies = {}, globals = {}) {
  const filename = path.resolve(__dirname, "..", file);
  const code = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(
    code,
    {
      exports,
      require: (name) => {
        if (Object.hasOwn(dependencies, name)) return dependencies[name];
        if (name.endsWith(".scss")) return { default: {} };
        return require(name);
      },
      ...globals,
    },
    { filename }
  );
  return exports;
}

const plain = (value) => JSON.parse(JSON.stringify(value));
const response = (rows) => ({ ok: true, json: async () => ({ rows }) });
const tick = () => new Promise((resolve) => setImmediate(resolve));

test("PRODUCTS precedes content; concurrent consumers share requests and tables stay isolated", async () => {
  const calls = [];
  let releaseCatalog;
  const service = loadModule(
    "src/services/productContent.ts",
    {},
    {
      fetch: async (url) => {
        calls.push(url.split("/").pop());
        if (url.endsWith("/576"))
          return new Promise((resolve) => {
            releaseCatalog = resolve;
          });
        return response([
          {
            id: 1,
            partNumber: 122065,
            displayName: url.endsWith("/582") ? "Product A" : "Product B",
            description: "Exact text  ",
            store_link: "https://example.test/?x=1&y=2",
            spec_material: "Rubber",
            maint_task: "Inspect",
            relatedProducts: " 12, 34, ",
            parentAssemblies: 56,
            components: "78",
          },
        ]);
      },
    }
  );
  const first = service.fetchProductParts(3263);
  const second = service.fetchProductParts("3263");
  const catalog = service.fetchProducts();
  assert.deepEqual(calls, ["576"]);
  releaseCatalog(
    response([
      { variantId: 3263, tableContentId: 582, label: "Axle" },
      { variantId: 3343, tableContentId: 583 },
    ])
  );
  const [a, duplicate] = await Promise.all([first, second]);
  assert.equal(a, duplicate);
  assert.equal((await catalog).get("3263").label, "Axle");
  assert.equal(a[0].partNumber, "122065");
  assert.equal(a[0].description, "Exact text  ");
  assert.deepEqual(plain(a[0].specifications), { Material: "Rubber" });
  assert.deepEqual(plain(a[0].maintenance), { interval: "", task: "Inspect", commonIssues: "" });
  assert.deepEqual(plain(a[0].relatedProducts), ["12", "34"]);
  assert.deepEqual(plain(a[0].parentAssemblies), ["56"]);
  assert.equal(Object.hasOwn(a[0], "productVariantId"), false);
  assert.equal(Object.hasOwn(a[0], "itemNumber"), false);
  assert.equal((await service.fetchProductParts(3343))[0].displayName, "Product B");
  assert.equal(await service.fetchProductParts(3263), a);
  assert.deepEqual(calls, ["576", "582", "583"]);
});

test("unpublished, invalid and missing mappings never request content or the old table", async () => {
  const calls = [];
  const service = loadModule(
    "src/services/productContent.ts",
    {},
    {
      fetch: async (url) => {
        calls.push(url);
        return response([
          { variantId: 1, tableContentId: 1111 },
          { variantId: 2, tableContentId: "" },
          { variantId: 3, tableContentId: "../524" },
        ]);
      },
    }
  );
  for (const id of [1, 2, 3, 2669]) assert.deepEqual(plain(await service.fetchProductParts(id)), []);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].endsWith("/576"));
});

test("catalog and content errors are evicted so subsequent mounts can retry", async () => {
  let catalogs = 0;
  let contents = 0;
  const service = loadModule(
    "src/services/productContent.ts",
    {},
    {
      fetch: async (url) => {
        if (url.endsWith("/576"))
          return ++catalogs === 1 ? { ok: false, status: 503 } : response([{ variantId: 3263, tableContentId: 582 }]);
        return ++contents === 1 ? { ok: false, status: 500 } : response([]);
      },
    }
  );
  await assert.rejects(service.fetchProductParts(3263), /503/);
  await assert.rejects(service.fetchProductParts(3263), /500/);
  assert.deepEqual(plain(await service.fetchProductParts(3263)), []);
  assert.equal(catalogs, 2);
  assert.equal(contents, 2);
});

test("product changes immediately hide old rows and ignore late responses after cleanup", async () => {
  let productId = 1;
  let state;
  let effect;
  let writes = 0;
  const pending = {};
  const hook = loadModule("src/hooks/useDatatableParts.ts", {
    react: {
      useState: (initial) => {
        state ??= initial;
        return [
          state,
          (value) => {
            state = value;
            writes++;
          },
        ];
      },
      useEffect: (callback) => {
        effect = callback;
      },
    },
    "../store/store": { useAppSelector: () => productId },
    "../store/slices/configurator/selectors/selectors": {},
    "../services/productContent": {
      fetchProductParts: (id) =>
        new Promise((resolve) => {
          pending[id] = resolve;
        }),
    },
  });
  hook.useDatatableParts();
  const cleanupFirst = effect();
  pending[1]([{ partNumber: "A" }]);
  await tick();
  assert.equal(hook.useDatatableParts().parts[0].partNumber, "A");
  productId = 2;
  assert.deepEqual(plain(hook.useDatatableParts().parts), []);
  cleanupFirst();
  const cleanupSecond = effect();
  productId = 3;
  hook.useDatatableParts();
  cleanupSecond();
  const cleanupThird = effect();
  pending[2]([{ partNumber: "STALE" }]);
  await tick();
  assert.deepEqual(plain(hook.useDatatableParts().parts), []);
  pending[3]([{ partNumber: "CURRENT" }]);
  await tick();
  assert.equal(hook.useDatatableParts().parts[0].partNumber, "CURRENT");
  cleanupThird();
  productId = 4;
  hook.useDatatableParts();
  const cleanupFourth = effect();
  cleanupFourth();
  const previousWrites = writes;
  pending[4]([]);
  await tick();
  assert.equal(writes, previousWrites);
});

/** Creates the table-only popup with the actual relationship lookup and tooltip effect. */
function popupFixture(parts) {
  const effects = [];
  const cleanup = [];
  const originalRenderer = () => "native content";
  const popup = { innerHTML: "native content", style: { cssText: "original" } };
  const outline = { _popup: popup, _options: { renderTooltip: originalRenderer, tooltipInteractive: false } };
  const identity = new Proxy(
    { partNumber: "123" },
    {
      get(target, key) {
        if (key !== "partNumber") throw new Error(`Unexpected PlayCanvas content read: ${String(key)}`);
        return target[key];
      },
    }
  );
  const hooks = { useDatatableParts: () => ({ parts, isLoading: false, error: null }) };
  const partHook = loadModule("src/hooks/useDataTablePart.ts", { "./useDatatableParts": hooks });
  const ui = loadModule(
    "src/components/PartPopup/PartPopup.tsx",
    {
      react: { ...React, useEffect: (effect) => effects.push(effect) },
      "../../hooks/usePartSelection": { usePartSelection: () => ({ selectedPart: identity, deselect() {} }) },
      "../../hooks/useDataTablePart": partHook,
      "../../hooks/useDatatableParts": hooks,
      "../../store/store": { useAppSelector: () => 3263 },
      "../../store/slices/configurator/selectors/selectors": {},
    },
    {
      window: {
        ConfiguratorAPI: {},
        pc: {
          app: {
            root: { forEach: (callback) => callback({ script: { lippertBridge: { _outlineService: outline } } }) },
          },
        },
      },
      clearInterval() {},
      setInterval() {
        throw new Error("Unexpected readiness polling");
      },
    }
  );
  const html = renderToStaticMarkup(React.createElement(ui.PartPopup));
  for (const effect of effects) cleanup.push(effect());
  return {
    html,
    tooltip: () => outline._options.renderTooltip(identity),
    outline,
    originalRenderer,
    cleanup: () => cleanup.forEach((fn) => fn?.()),
  };
}

test("popup and annotation use only table fields, including relationships, escaped text and store labels", () => {
  const base = {
    id: "1",
    partNumber: "123",
    displayName: "Table <title>",
    groupName: "Table group",
    category: "Table category",
    description: "Table description <script>",
    technicalNotes: "Table notes",
    specifications: { Material: "Table material" },
    maintenance: { interval: "Table interval", task: "Table task", commonIssues: "Table issues" },
    storeLink: "https://example.test/?a=1&b=2",
    storeLinkText: "Buy from table",
    relatedProducts: ["456", "missing"],
    parentAssemblies: ["456"],
    components: ["456"],
  };
  const related = {
    ...base,
    partNumber: "456",
    displayName: "Related table part",
    relatedProducts: [],
    parentAssemblies: [],
    components: [],
  };
  const fixture = popupFixture([base, related]);
  for (const value of [
    "Table &lt;title&gt;",
    "Table notes",
    "Table material",
    "Table interval",
    "Table task",
    "Table issues",
    "Related table part",
  ])
    assert.ok(fixture.html.includes(value), value);
  const tooltip = fixture.tooltip();
  assert.ok(tooltip.includes("Table description &lt;script&gt;"));
  assert.ok(tooltip.includes("Buy from table"));
  assert.ok(tooltip.includes("?a=1&amp;b=2"));
  fixture.cleanup();
  assert.equal(fixture.outline._options.renderTooltip, fixture.originalRenderer);
  assert.equal(fixture.outline._options.tooltipInteractive, false);
  assert.equal(fixture.outline._popup.style.cssText, "original");
});

test("missing rows and empty fields never fall back to PlayCanvas content", () => {
  const missing = popupFixture([]);
  assert.equal(missing.html, "");
  assert.equal(missing.tooltip(), "");
  missing.cleanup();
  const sparse = popupFixture([
    {
      partNumber: "123",
      displayName: "",
      groupName: "Table-only group",
      category: "",
      description: "",
      technicalNotes: "",
      specifications: {},
      maintenance: null,
      storeLink: "NLA",
      storeLinkText: "",
      relatedProducts: [],
      parentAssemblies: [],
      components: [],
    },
  ]);
  assert.ok(sparse.html.includes("Table-only group"));
  assert.ok(!sparse.html.includes("Specifications"));
  assert.ok(!sparse.html.includes("Maintenance"));
  assert.ok(!sparse.html.includes("href="));
  assert.ok(!sparse.tooltip().includes("href="));
  sparse.cleanup();
});

test("selection retains only partNumber and cleans up scene subscriptions", () => {
  const effects = [];
  const states = [];
  let onSelect;
  let subscriptionsRemoved = 0;
  const hook = loadModule(
    "src/hooks/usePartSelection.ts",
    {
      react: {
        useEffect: (effect) => effects.push(effect),
        useRef: (current) => ({ current }),
        useCallback: (fn) => fn,
        useState: (value) => {
          const i = states.length;
          states.push(value);
          return [
            value,
            (next) => {
              states[i] = next;
            },
          ];
        },
      },
    },
    {
      window: {
        addEventListener() {},
        removeEventListener() {},
        ConfiguratorAPI: {
          outline: {
            onSelect: (callback) => {
              onSelect = callback;
              return () => subscriptionsRemoved++;
            },
            onDeselect: () => () => subscriptionsRemoved++,
          },
        },
      },
    }
  );
  hook.usePartSelection();
  const cleanups = effects.map((effect) => effect());
  onSelect({ partNumber: 123, description: "Ignored", specifications: { Weight: "Ignored" } });
  assert.deepEqual(plain(states[0]), { partNumber: "123" });
  cleanups.forEach((cleanup) => cleanup());
  assert.equal(subscriptionsRemoved, 2);
});
