# Lippert PlayCanvas Demo

Документація для швидкого онбордингу нового розробника в проект
`lipper-demo-playcanvas`.

Це React/Treble застосунок, який вбудовує PlayCanvas-конфігуратор Lippert,
читає дані продукту з Vivid Render Admin, збагачує анотації через dataTable і
додає UI для керування частинами, камерами, анотаціями та AR-експортом.

## Швидкий старт

Вимоги:

- Node.js 18 або новіший.
- npm.
- Доступ до інтернету для завантаження PlayCanvas bundle, Vivid product API і
  dataTable.

Встановлення:

```bash
npm install
```

Локальний frontend:

```bash
npm start
```

За замовчуванням dev server працює на:

```text
http://localhost:5173
```

Відкрити конкретний продукт:

```text
http://localhost:5173/2669
http://localhost:5173/3263
http://localhost:5173/3264
```

Production build:

```bash
npm run build
```

Локальний backend для AR:

```bash
PORT=8080 npm run serve
```

У dev-режимі frontend на `5173` автоматично відправляє AR upload-запити на
`http://localhost:8080`.

## Live demo та інфраструктура

Production demo:

```text
https://lippert-parts.vivid3d.tech/3264
```

DigitalOcean App Platform project:

```text
https://cloud.digitalocean.com/apps/6df1722f-fa88-4e17-beab-fb1e20b0deda?i=baf4da
```

Ці посилання корисні для перевірки production build, deployment status,
runtime logs і змін після деплою.

## Основні скрипти

```bash
npm start
```

Запускає Treble dev server на порту `5173`.

```bash
npm run build
```

Збирає production bundle у `build/`.

```bash
npm run serve
```

Запускає `server.js`. Він потрібен для email endpoint та AR upload/view flow.

```bash
npm run lint
```

Запускає ESLint для `src/`.

```bash
npm run format
```

Форматує `src/` через Prettier.

## Як працює URL продукту

Роутинг описаний у `src/router/router.tsx`.

- `/` відкриває конфігуратор з дефолтним продуктом.
- `/:productId` відкриває PlayCanvas bundle і VV атрибути для конкретного
  product id.

Дефолтний product id зараз:

```ts
// src/configurator/productInstance.ts
export const DEFAULT_PRODUCT_ID = 2669;
```

`ProductProvider` на рівні router читає параметр, перевіряє його та зберігає
поточний `productId` у Redux. Компоненти конфігуратора використовують значення
зі store, а не читають параметр маршруту повторно.

PlayCanvas bundle вантажиться з DigitalOcean Spaces/CDN:

```text
https://2d-render-admin-storage.fra1.cdn.digitaloceanspaces.com/projects/428/products/:productId/playcanvas/
```

Це робить `src/components/PlayCanvasPlayer/PlayCanvasPlayer.tsx`.

## Архітектура

Ключові частини застосунку:

```text
src/
  components/
    PlayCanvasPlayer/        Завантаження PlayCanvas bundle.
    PartsListPanel/          UI Parts List, Explode, Annotations, sub assemblies.
    PartPopup/               Popup деталей вибраної 3D-анотації.
    CameraController/        Кнопки перемикання камер.
    PlayerWidgets/           Нижні віджети, зокрема AR button.
  configurator/
    productInstance.ts       Base URL Vivid API і дефолтний product id.
    mockAttributes.ts        Побудова локального кешу атрибутів з VV.
    playcanvasBridge.ts      Мапінг UI attribute name -> ConfiguratorAPI key.
    attributeMetadataMap.ts  Мапінг variant name -> boolean/asset значення.
  hooks/
    useConfiguratorAPI.ts    Доступ до window.ConfiguratorAPI.
    usePartSelection.ts      Підписка на outline select/deselect з PlayCanvas.
    useDatatableParts.ts     Контент поточного продукту через PRODUCTS.tableContentId.
  services/
    productAttributes/       Vivid product API client.
  modules/
    ar-module/               AR export hook і popup.
server.js                    Express backend для email та AR upload/view.
```

## Data sources

У проекті є три різні джерела даних. Їх важливо не змішувати.

### 1. PlayCanvas bundle

PlayCanvas bundle є джерелом 3D-сцени, entities, outline groups, 3D-анотацій,
камер і `window.ConfiguratorAPI`.

Frontend не генерує 3D-анотації сам. Він лише підписується на API, який
експортується PlayCanvas bundle.

Основний компонент:

```text
src/components/PlayCanvasPlayer/PlayCanvasPlayer.tsx
```

Він:

- створює `<canvas id="application-canvas">`;
- додає stylesheet, manifest, import map і `js/index.mjs` для product id;
- чекає появи `window.ConfiguratorAPI`;
- чистить старий PlayCanvas app при unmount або зміні product id.

### 2. Vivid product API

Vivid product API використовується для списку доступних атрибутів продукту.

Endpoint:

```text
https://renderadmin.vivid3d.tech/products/:productId
```

Клієнт:

```text
src/services/productAttributes/ProductAttributesService.ts
```

Логіка:

- читає `availableOptions` і `availableGeometryOptions`;
- бере тільки group з `enabled: true`;
- ключем атрибута стає `proxyName`;
- variants також фільтруються за `enabled`.

Для boolean controls важливі саме назви `proxyName`, наприклад:

```text
Explode
Annotations
Hub Assembly
Spindle Assembly
Spring Assembly
Brake Assembly
```

### 3. PRODUCTS і таблиці контенту продуктів

Спочатку клієнт завантажує PRODUCTS:

```text
https://renderadmin.vivid3d.tech/datatables/576
```

Рядок вибирається за `variantId`, що відповідає ID продукту з маршруту.
`label` використовується в заголовку, а `tableContentId` визначає наступний запит:
`https://renderadmin.vivid3d.tech/datatables/{tableContentId}`.
Завантаження PRODUCTS спільне для назви й контенту; таблиці контенту кешуються
окремо за ID. Помилкові запити можна повторити після повторного монтування.
Після редагування таблиць в адмінці потрібно перезавантажити сторінку.

Відсутній продукт, порожній/некоректний `tableContentId` або заглушка `1111`
означають відсутність контенту. Інша таблиця та дані PlayCanvas не підставляються.
Для `/` залишається ID `2669`; контент з'явиться лише за наявності його запису
в PRODUCTS. У поточних таблицях продукт `3263` посилається на таблицю `582`.

Код:

```text
src/services/productContent.ts
src/hooks/useDatatableParts.ts
src/hooks/useDataTablePart.ts
src/components/PartPopup/PartPopup.tsx
```

Поля PRODUCT-CONTENT:

```text
id
side
partNumber
displayName
groupName
category
description
technical_notes
relatedProducts
parentAssemblies
components
store_link
store_link_text
spec_material
spec_weight
spec_torque
spec_bearing_type
spec_brake_type
spec_spring_type
spec_load_capacity
spec_lining_life
spec_durability
maint_interval
maint_task
maint_common_issues
```

`itemNumber` і `productVariantId` більше не використовуються в таблиці контенту.
`partNumber` має бути унікальним у межах таблиці. Popup та підказка наведення
беруть із PlayCanvas лише `partNumber`; усі тексти, посилання, характеристики
та обслуговування надходять виключно з відповідного рядка таблиці.
Якщо рядка немає, popup і текст підказки не відображаються.
`relatedProducts`, `parentAssemblies` і `components` містять артикули через кому;
відповідні рядки шукаються лише в тій самій таблиці. Відсутні рядки пропускаються.
При зміні продукту старий контент приховується, запізнілі відповіді ігноруються.
Таблиця не є джерелом 3D entities і не вмикає самі PlayCanvas-анотації.

## Parts List

Компонент:

```text
src/components/PartsListPanel/PartsListPanel.tsx
```

Верхні controls:

- `Axle Assembly` -> `Explode`;
- `Annotations` -> `annotationsVisible`.

Чотири sub assembly rows:

```text
Hub Assembly
Spindle Assembly
Spring Assembly
Brake Assembly
```

Ці чотири рядки спеціально показуються тільки тоді, коли відповідний attribute
прийшов з VV product API. Тобто для product id має існувати enabled geometry
option або option з таким `proxyName`.

Мапінг у PlayCanvas config:

```ts
// src/configurator/playcanvasBridge.ts
'Hub Assembly' -> 'hubAssemblyVisible'
'Brake Assembly' -> 'brakeAssemblyVisible'
'Spring Assembly' -> 'springAssemblyVisible'
'Spindle Assembly' -> 'spindleAssemblyVisible'
'Explode' -> 'explodeStatus'
'Annotations' -> 'annotationsVisible'
```

Якщо рядок не видно:

1. Перевірити `https://renderadmin.vivid3d.tech/products/:productId`.
2. Переконатися, що `availableGeometryOptions` або `availableOptions` має
   enabled group з потрібним `proxyName`.
3. Переконатися, що `useAttribute()` має цей attribute у локальному кеші.
4. Перевірити, чи PlayCanvas bundle підтримує відповідний config key.

## Анотації і popup

3D-анотації приходять з PlayCanvas outline service. React отримує вибрану
анотацію через:

```text
src/hooks/usePartSelection.ts
```

Цей hook підписується на:

```ts
window.ConfiguratorAPI.outline.onSelect(...)
window.ConfiguratorAPI.outline.onDeselect(...)
```

Popup:

```text
src/components/PartPopup/PartPopup.tsx
```

Popup і підказка наведення використовують `partNumber` із PlayCanvas лише як
ключ пошуку. Контент береться виключно з таблиці, визначеної через PRODUCTS.
Порожні поля не доповнюються даними PlayCanvas.

Важливо:

- entities, anchor і видимість 3D-анотацій налаштовуються в PlayCanvas;
- тексти, store link, specs та maintenance змінюються в PRODUCT-CONTENT;
- нові поля потрібно додавати до parser у `src/services/productContent.ts`
  та rendering у `PartPopup.tsx`;
- maintenance має єдиний UI-формат `interval`, `task`, `commonIssues`.

## AR flow

UI:

```text
src/components/PlayerWidgets/PlayerWidgetBottomCenter/PlayerWidgetBottomCenter.tsx
src/modules/ar-module/ui/ArPopup/ArPopup.tsx
```

Hook:

```text
src/modules/ar-module/hooks/useArExport.ts
```

Backend:

```text
server.js
```

Flow:

1. Користувач натискає `View in AR`.
2. Frontend чекає `window.configurator`.
3. Викликаються:

   ```ts
   configurator.exportGLBAsBlob()
   configurator.exportUSDZAsBlob()
   ```

4. Files відправляються на:

   ```text
   POST /api/ar/upload
   ```

5. `server.js` зберігає `.glb`, `.usdz` і `.json` в `ar-models/`.
6. Frontend отримує `id` і генерує QR на:

   ```text
   /ar/view/:id
   ```

У dev-режимі, якщо frontend відкритий на `localhost:5173`, upload піде на
`localhost:8080`. За потреби можна перевизначити:

```js
window.__AR_API_BASE__ = "http://localhost:9000";
```

Більше деталей є у:

```text
AR-PLAYCANVAS-API.md
CLIENT_INTEGRATION_GUIDE.md
```

## Як оновлювати контент

### Оновити тексти popup

Оновити таблицю з `tableContentId` відповідного рядка PRODUCTS (`576`).

Мінімально важливі поля:

```text
groupName
partNumber
displayName
description
technical_notes
store_link
store_link_text
```

`partNumber` має збігатися з артикулом PlayCanvas. `groupName` — резервна назва з таблиці.

### Оновити 3D-анотації

Оновлювати PlayCanvas definitions/bundle. dataTable не містить `entities`,
`anchorEntity`, model routing або visibility map, тому він не може сам
відтворити 3D-анотації.

Якщо команда вирішить зробити dataTable джерелом 3D-анотацій, тоді треба
розширювати схему хоча б такими полями:

```text
productId
modelName
entities
anchorEntity
enabled
```

Для `entities` краще використовувати delimiter `|`, а не кому, щоб не ламати
CSV parsing:

```text
6000_LeafSpring_Body_Left|6000_LeafSpring_Clip_Left
```

### Додати новий visibility toggle

1. Додати відповідний `proxyName` у VV product API.
2. Додати metadata у `src/configurator/attributeMetadataMap.ts`.
3. Додати mapping у `src/configurator/playcanvasBridge.ts`.
4. Переконатися, що PlayCanvas bundle підтримує config key.
5. Додати UI row/control у відповідному компоненті.

### Змінити дефолтний продукт

Оновити:

```text
src/configurator/productInstance.ts
src/components/PlayCanvasPlayer/PlayCanvasPlayer.tsx
```

Також перевірити, що для нового product id існує PlayCanvas bundle у
DigitalOcean Spaces і VV product API повертає потрібні attributes.

## Backend endpoints

`server.js` містить:

```text
GET  /api/health
POST /api/email
POST /api/ar/upload
GET  /ar/models/:id/model.glb
GET  /ar/usdz/:id/model.usdz
GET  /ar/view/:id
```

`POST /api/email` використовує `POSTMARK_TOKEN`.

```bash
POSTMARK_TOKEN=... PORT=8080 npm run serve
```

AR upload пише файли у локальну папку:

```text
ar-models/
```

Цю папку не потрібно комітити.

Локальні регресійні перевірки завантаження контенту, зміни продукту та popup
(без звернень до зовнішньої мережі):

```bash
node --test scripts/test-product-content.cjs
```

## Deployment notes

Production entrypoint віддає `treble-app.js` і `treble-app.css`.

Перед деплоєм:

```bash
npm run build
```

Після деплою перевірити:

- `/` відкриває дефолтний продукт;
- `/:productId` відкриває конкретний продукт;
- PlayCanvas canvas доходить до `ready`;
- `Parts List` показує тільки VV-enabled attributes;
- `Annotations` toggle вмикає/вимикає 3D labels;
- click по annotation відкриває popup із таблиці поточного продукту;
- `View in AR` відкриває popup і генерує QR або iOS AR link.

## Debugging checklist

### PlayCanvas не завантажився

- Перевірити Network для `styles.css`, `manifest.json`, `js/index.mjs`.
- Перевірити правильність product id у URL.
- Перевірити, чи з'явився `window.ConfiguratorAPI`.
- Дивитися console errors з `PlayCanvas init failed`.

### Parts List не показує sub assemblies

- Перевірити VV endpoint `/products/:productId`.
- Перевірити `proxyName` і `enabled`.
- Перевірити `ProductAttributesService.getAttributes()`.
- Перевірити `useAttribute()` cache.
- Перевірити `ATTR_TO_PC_KEY` у `playcanvasBridge.ts`.

### Popup не має текстів

- Перевірити PRODUCTS (`576`): `variantId` і реальний `tableContentId` замість `1111`.
- Перевірити наявність `partNumber` у таблиці контенту цього продукту.
- Порожні поля та відсутні рядки більше не доповнюються даними PlayCanvas.
- Перевірити, чи `useDatatableParts()` успішно завантажив rows.

### AR не працює

- Перевірити, що backend `server.js` запущений.
- У dev перевірити `http://localhost:8080/api/health`.
- Перевірити, що PlayCanvas export methods доступні на `window.configurator`.
- Перевірити logs backend для `[AR] Upload/optimize failed`.

## Git workflow

Основна робоча гілка для поточного AR flow:

```text
main-ar
```

Перед змінами:

```bash
git status
git pull --ff-only
```

Перед push:

```bash
npm run build
git status
```

Комітити тільки зміни, які належать до задачі. У репозиторії можуть бути
локальні generated або робочі файли, які не треба випадково додавати.
