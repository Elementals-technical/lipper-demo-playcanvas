# PlayCanvas API — контракт для AR

Цей документ описує **що саме** PlayCanvas-білд повинен виставити у `window`, щоб AR-модуль ([src/modules/ar-module/](src/modules/ar-module/)) працював.

## Коротко

AR-модуль залежить виключно від **двох методів** на `window.configurator`:

```ts
window.configurator.exportGLBAsBlob(): Promise<Blob>    // для Android Scene Viewer
window.configurator.exportUSDZAsBlob(): Promise<Blob>   // для iOS Quick Look
```

Більше нічого AR-флоу не потребує.

## Контракт

| Метод | Повертає | Споживач |
|---|---|---|
| `exportGLBAsBlob()` | `Promise<Blob>` (MIME `model/gltf-binary`) | Android Scene Viewer + серверна оптимізація через `@gltf-transform/*` |
| `exportUSDZAsBlob()` | `Promise<Blob>` (MIME `model/vnd.usdz+zip`) | iOS Quick Look, pass-through на сервер |

### Де ці методи викликаються

[src/modules/ar-module/hooks/useArExport.ts:70-74](src/modules/ar-module/hooks/useArExport.ts#L70-L74):

```ts
const [glb, usdz]: [Blob, Blob] = await Promise.all([
  configurator.exportGLBAsBlob(),
  configurator.exportUSDZAsBlob(),
]);
```

Обидва виклики робляться **паралельно**. Хук чекає на `window.configurator` до 10 секунд через `waitForConfigurator` — якщо за цей час обʼєкт або методи не зʼявились, статус переходить у `"error"`.

## Вимоги до GLB

- Містить **поточний стан сцени** після всіх застосованих `setConfig` (геометрія + матеріали + текстури).
- **Embedded binary** формат (`.glb`, а не розпакована пара `.gltf` + `.bin`).
- Бажано у світових координатах — трансформи запечені у вершини.
- Сервер додатково чистить `clearNodeTransform` лише для вузлів із **від'ємним scale** ([server.js — optimizeGlb](server.js)) — це фікс для Android Scene Viewer (інакше геометрія «вивертається»). Усі інші трансформи PlayCanvas має запекти сам.
- Файли ≥ 5 МБ сервер додатково стискає: Draco + WebP texture compression (q95). Менші — пропускає без змін.

## Вимоги до USDZ

- Валідний zip-контейнер, сумісний з **Apple AR Quick Look** (специфічно: 64-byte alignment усередині zip, правильний `Content-Type: model/vnd.usdz+zip`).
- Текстури всередині — **jpg/png** (Quick Look **не підтримує** webp).
- Одразу готовий до відкриття — сервер робить **pass-through** без жодних модифікацій.

## Перевірка у рантаймі

Відкрийте DevTools після того, як PlayCanvas повністю завантажився, і виконайте:

```js
typeof window.configurator?.exportGLBAsBlob   // має бути "function"
typeof window.configurator?.exportUSDZAsBlob  // має бути "function"
```

Якщо будь-який повертає `"undefined"`:
- хук зависне на `waitForConfigurator(10000)`,
- після 10 секунд стан перейде у `"error"`,
- у консолі буде `[AR] window.configurator not ready after 10s`.

## Що робити, якщо методи відсутні

### Варіант A — додати методи у PlayCanvas-білд

Це **не** стандартний API PlayCanvas Engine, а кастомна обгортка над конфігуратором. Реалізація зазвичай виглядає так:

```js
// Всередині PlayCanvas-білда (той, що лежить у CDN і завантажується через
// src/components/PlayCanvasPlayer/PlayCanvasPlayer.tsx)
window.configurator = {
  // ... existing methods (setConfig, getConfig, ...) ...

  async exportGLBAsBlob() {
    const exporter = new pc.GlbExporter();
    const arrayBuffer = await exporter.build(app.root, {
      // опції — залежать від версії Engine
    });
    return new Blob([arrayBuffer], { type: 'model/gltf-binary' });
  },

  async exportUSDZAsBlob() {
    // Кастомний USDZ-експортер — немає в PlayCanvas Engine з коробки.
    // Зазвичай реалізується через окрему бібліотеку (three-usdz-exporter
    // портовану на pc.Mesh, або pre-built USD WASM).
    const buffer = await yourUsdzExporter.build(app.root);
    return new Blob([buffer], { type: 'model/vnd.usdz+zip' });
  },
};
```

Документація PlayCanvas по GLB-експорту: [GlbExporter API](https://developer.playcanvas.com/api/pc.GlbExporter.html).

USDZ — в офіційному API відсутній, потрібно окремо (приклади: `three-usdz-exporter`, `USDZExporter` з Three.js, портована логіка).

### Варіант B — назви методів у білді інші

У quadratec і lci-demo-asseId використовується саме `window.configurator.exportGLBAsBlob/exportUSDZAsBlob`. Якщо у вашому білді інші імена — наприклад, `window.ConfiguratorAPI.exportGLB()` або `window.configurator.toGLB()` — достатньо змінити один файл:

```ts
// src/modules/ar-module/hooks/useArExport.ts
const [glb, usdz] = await Promise.all([
  configurator.exportGLBAsBlob(),  // ← замініть
  configurator.exportUSDZAsBlob(), // ← замініть
]);
```

І, за потреби, змінити `waitForConfigurator` щоб він чекав саме той global, у якому ваші методи.

## Опційні методи (не потрібні для AR)

Для повноти — інші методи, які PlayCanvas-білди lci/quadratec виставляють, але які AR-модуль **не** використовує:

| Метод | Роль |
|---|---|
| `window.configurator.setConfig({ ... })` | застосувати конфігурацію до сцени |
| `window.configurator.getConfig()` | отримати поточну конфігурацію |
| `window.ConfiguratorAPI.setConfig` | альтернативна точка входу (у lci використовується в [src/configurator/playcanvasBridge.ts:41-47](src/configurator/playcanvasBridge.ts#L41-L47)) |
| `window.pc.Application.getApplication()` | доступ до екземпляра PlayCanvas Application |

AR-флоу ці методи **не чіпає** — він бере вже фінальну сцену, яку користувач налаштував через UI, і просто експортує два файли.

## Діаграма залежностей

```
UI кнопка "View in AR"
   │
   ▼
useArExport.trigger()
   │
   ├─ waitForConfigurator(10s)   ← очікує window.configurator
   │
   ├─ configurator.exportGLBAsBlob()    ← PlayCanvas contract #1
   ├─ configurator.exportUSDZAsBlob()   ← PlayCanvas contract #2
   │
   ├─ POST /api/ar/upload                 (multipart: glb + usdz)
   │   └─ server.js → optimizeGlb() + USDZ pass-through → ar-models/{id}.*
   │
   └─ QR → /ar/view/{id}
           └─ iOS Quick Look  (rel="ar" + .usdz)
              Android Scene Viewer (intent:// + .glb)
```

**Контракт із PlayCanvas — мінімальний: два методи. Усе інше — серверна й фронтова обгортка, яка вже реалізована і не залежить від внутрішньої архітектури білда.**
