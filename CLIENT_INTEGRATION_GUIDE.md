# PlayCanvas Configurator — Client UI Integration Guide

## Table of Contents

1. [Overview](#overview)
2. [Embedding the Player](#embedding-the-player)
3. [API Reference: `window.ConfiguratorAPI`](#api-reference)
4. [Configuration Methods](#configuration-methods)
5. [Camera Control API](#camera-control-api)
6. [Outline (Part Selection) API](#outline-api)
7. [Annotations API](#annotations-api)
8. [Event System & State Subscriptions](#event-system)
9. [Available Configuration Options](#available-options)
10. [Integration Patterns & Examples](#integration-patterns)
11. [Debug Mode](#debug-mode)
12. [Troubleshooting](#troubleshooting)

---

## 1. Overview <a id="overview"></a>

PlayCanvas Configurator — це 3D-плеєр на базі PlayCanvas Engine, який надає зовнішній JavaScript API через глобальний об'єкт `window.ConfiguratorAPI`. Клієнтський UI (React, Vue, Angular, vanilla JS) взаємодіє з плеєром через цей API, не маючи прямого доступу до PlayCanvas internals.

**Архітектура взаємодії:**

```
┌─────────────────────────────┐     window.ConfiguratorAPI      ┌──────────────────────┐
│      Client UI (iframe)     │  ◄──────────────────────────►   │   PlayCanvas Player  │
│  React / Vue / Angular / JS │     postMessage (cross-origin)  │   (canvas + scripts) │
│                             │     або direct call (same-origin)│                      │
└─────────────────────────────┘                                  └──────────────────────┘
```

---

## 2. Embedding the Player <a id="embedding-the-player"></a>

### Варіант A: iframe (рекомендований для cross-origin)

```html
<iframe
  id="configurator-frame"
  src="https://playcanv.as/p/YOUR_PROJECT_ID/"
  width="100%"
  height="600"
  frameborder="0"
  allow="autoplay; fullscreen; xr-spatial-tracking"
  allowfullscreen
></iframe>
```

Для доступу до API через iframe:

```javascript
const frame = document.getElementById('configurator-frame');

// Дочекайтесь завантаження
frame.addEventListener('load', () => {
  const api = frame.contentWindow.ConfiguratorAPI;

  // Або підпишіться на подію ready
  frame.contentWindow.addEventListener('message', (e) => {
    if (e.data?.type === 'configurator:ready') {
      // API готовий до використання
    }
  });
});
```

### Варіант B: Same-origin (direct script)

Якщо плеєр і клієнтський UI на одному домені:

```javascript
// Дочекайтесь ініціалізації
function waitForAPI() {
  return new Promise((resolve) => {
    if (window.ConfiguratorAPI) {
      resolve(window.ConfiguratorAPI);
      return;
    }
    const check = setInterval(() => {
      if (window.ConfiguratorAPI) {
        clearInterval(check);
        resolve(window.ConfiguratorAPI);
      }
    }, 100);
  });
}

const api = await waitForAPI();
```

### Варіант C: Підписка на PlayCanvas event (всередині PlayCanvas)

```javascript
app.on('configurator:ready', () => {
  const api = window.ConfiguratorAPI;
  // API повністю ініціалізований
});
```

---

## 3. API Reference <a id="api-reference"></a>

Повна структура `window.ConfiguratorAPI`:

```typescript
interface ConfiguratorAPI {
  // ── Configuration ──
  setConfig(partial: Partial<ConfigState>): Promise<void>;
  getConfig(): ConfigState;
  subscribe(callback: (newState, oldState) => void): () => void;
  getAvailableOptions(): AvailableOptions;
  resetConfig(): Promise<void>;

  // ── Camera ──
  camera: CameraAPI;

  // ── Project-specific (Lippert) ──
  outline: OutlineAPI;
  annotations: AnnotationsAPI;
}
```

---

## 4. Configuration Methods <a id="configuration-methods"></a>

### `setConfig(partialConfig)`

Застосовує часткове оновлення конфігурації. Змінює лише передані поля, інші залишаються без змін. **Асинхронний** — повертає Promise.

```javascript
// Увімкнути explode та приховати hub assembly
await ConfiguratorAPI.setConfig({
  explodeStatus: true,
  hubAssemblyVisible: false,
});

// Змінити лише позицію камери
await ConfiguratorAPI.setConfig({
  cameraPosition: 'front',
});
```

### `getConfig()`

Повертає копію поточного стану конфігуратора.

```javascript
const state = ConfiguratorAPI.getConfig();
// {
//   explodeStatus: false,
//   hubAssemblyVisible: true,
//   spindleAssemblyVisible: true,
//   springAssemblyVisible: true,
//   brakeAssemblyVisible: true,
//   cameraPosition: 'iso',
//   annotationsVisible: false
// }
```

### `subscribe(callback)`

Підписка на зміни стану. Повертає функцію для відписки.

```javascript
const unsubscribe = ConfiguratorAPI.subscribe((newState, oldState) => {
  // Відреагувати на зміни
  if (newState.explodeStatus !== oldState.explodeStatus) {
    updateExplodeButton(newState.explodeStatus);
  }
  if (newState.cameraPosition !== oldState.cameraPosition) {
    highlightActiveCamera(newState.cameraPosition);
  }
});

// Пізніше: відписатися
unsubscribe();
```

### `getAvailableOptions()`

Повертає метадані для автоматичної генерації UI-контролів.

```javascript
const options = ConfiguratorAPI.getAvailableOptions();
// {
//   explodeStatus: { type: 'boolean' },
//   hubAssemblyVisible: { type: 'boolean' },
//   spindleAssemblyVisible: { type: 'boolean' },
//   springAssemblyVisible: { type: 'boolean' },
//   brakeAssemblyVisible: { type: 'boolean' },
//   cameraPosition: {
//     type: 'string',
//     options: [
//       { value: 'top', label: 'Top' },
//       { value: 'front', label: 'Front' },
//       { value: 'left', label: 'Left' },
//       { value: 'right', label: 'Right' },
//       { value: 'back', label: 'Back' },
//       { value: 'iso', label: 'Iso' }
//     ]
//   },
//   annotationsVisible: { type: 'boolean' }
// }
```

### `resetConfig()`

Скидає конфігурацію до початкового стану. **Асинхронний**.

```javascript
await ConfiguratorAPI.resetConfig();
```

---

## 5. Camera Control API <a id="camera-control-api"></a>

Доступ: `ConfiguratorAPI.camera`

### Orbit (обертання навколо моделі)

| Метод | Опис |
|-------|------|
| `getYaw()` → `number` | Поточний горизонтальний кут (градуси) |
| `setYaw(degrees)` | Встановити горизонтальний кут |
| `getPitch()` → `number` | Поточний вертикальний кут (градуси) |
| `setPitch(degrees)` | Встановити вертикальний кут |
| `getDistance()` → `number` | Поточна відстань від pivot |
| `setDistance(value)` | Встановити відстань |
| `getPivotPoint()` → `{x, y, z}` | Точка, навколо якої обертається камера |
| `setPivotPoint(x, y, z)` або `setPivotPoint({x, y, z})` | Змінити pivot point |

```javascript
// Повернути камеру на 45° по горизонталі
ConfiguratorAPI.camera.setYaw(45);

// Наблизити камеру
ConfiguratorAPI.camera.setDistance(3.5);

// Змінити точку обертання
ConfiguratorAPI.camera.setPivotPoint({ x: 0, y: 1.2, z: 0 });
```

### Reset та Focus

```javascript
// Скинути орбіту з конкретними параметрами
ConfiguratorAPI.camera.reset(yaw, pitch, distance);

// Фокус на конкретному entity за іменем
ConfiguratorAPI.camera.focus('HubAssembly_Left');
```

### Анімовані переходи

```javascript
// Перехід до збереженої позиції камери за ідентифікатором
ConfiguratorAPI.camera.transitionTo('front', {
  duration: 0.8,
  onComplete: () => console.log('Transition done'),
});

// Скасувати поточний перехід
ConfiguratorAPI.camera.cancelTransition();

// Повернутись до стартової позиції
ConfiguratorAPI.camera.resetToDefault({ duration: 1.0 });

// Перевірити чи йде анімація
if (ConfiguratorAPI.camera.isTransitioning()) {
  // ...
}
```

### Управління вводом

```javascript
// Вимкнути взаємодію мишею (наприклад, при показі модального вікна)
ConfiguratorAPI.camera.setMouseInputEnabled(false);

// Вимкнути тач
ConfiguratorAPI.camera.setTouchInputEnabled(false);

// Вимкнути все одночасно
ConfiguratorAPI.camera.setInputEnabled(false);

// Увімкнути назад
ConfiguratorAPI.camera.setInputEnabled(true);
```

### Авто-обертання

```javascript
// Встановити швидкість авто-обертання (0 = вимкнено)
ConfiguratorAPI.camera.setAutoOrbitSpeed(5);

// Затримка бездіяльності перед початком авто-обертання (секунди)
ConfiguratorAPI.camera.setIdleAutoOrbitDelay(3);
```

### Обмеження камери

```javascript
// Обмежити наближення/віддалення
ConfiguratorAPI.camera.setDistanceMin(2.0);
ConfiguratorAPI.camera.setDistanceMax(15.0);

// Обмежити вертикальний кут (градуси)
ConfiguratorAPI.camera.setPitchAngleMin(-30);
ConfiguratorAPI.camera.setPitchAngleMax(60);
```

### Зчитування позиції (read-only)

```javascript
const pos = ConfiguratorAPI.camera.getPosition();   // { x, y, z }
const fwd = ConfiguratorAPI.camera.getForward();     // { x, y, z }
```

---

## 6. Outline (Part Selection) API <a id="outline-api"></a>

Доступ: `ConfiguratorAPI.outline`

Дозволяє програмно керувати виділенням та підсвічуванням частин моделі.

| Метод | Опис |
|-------|------|
| `getGroups()` → `Array` | Список всіх груп деталей |
| `getSelectedGroup()` → `object \| null` | Поточна виділена група |
| `selectGroup(groupName)` | Програмно виділити групу |
| `deselect()` | Зняти виділення |
| `highlightGroup(groupName)` | Підсвітити групу (hover ефект) |
| `clearHighlight()` | Зняти підсвічування |

```javascript
// Отримати список всіх деталей
const groups = ConfiguratorAPI.outline.getGroups();
// [
//   { itemNumber: 1, groupName: 'Hub Assembly Left', partNumber: '...', ... },
//   { itemNumber: 2, groupName: 'Spindle Left', ... },
//   ...
// ]

// Виділити деталь за назвою (відкриє інфо-модал в 3D)
ConfiguratorAPI.outline.selectGroup('Hub Assembly Left');

// Зняти виділення
ConfiguratorAPI.outline.deselect();

// Hover-ефект (без кліку)
ConfiguratorAPI.outline.highlightGroup('Brake Assembly Left');
ConfiguratorAPI.outline.clearHighlight();
```

---

## 7. Annotations API <a id="annotations-api"></a>

Доступ: `ConfiguratorAPI.annotations`

Керує відображенням нумерованих підписів (callout labels) на 3D-моделі.

| Метод | Опис |
|-------|------|
| `show()` | Показати всі анотації |
| `hide()` | Приховати анотації |
| `isVisible()` → `boolean` | Перевірити стан видимості |

```javascript
// Показати анотації
ConfiguratorAPI.annotations.show();

// Або через конфігурацію (еквівалентно)
await ConfiguratorAPI.setConfig({ annotationsVisible: true });
```

---

## 8. Event System & State Subscriptions <a id="event-system"></a>

### Підписка на зміни стану

Основний спосіб реактивної взаємодії з плеєром:

```javascript
const unsubscribe = ConfiguratorAPI.subscribe((newState, oldState) => {
  // Порівняйте значення для визначення, що змінилось
  for (const key of Object.keys(newState)) {
    if (newState[key] !== oldState[key]) {
      console.log(`${key}: ${oldState[key]} → ${newState[key]}`);
    }
  }
});
```

### Глобальна подія готовності

Подія `configurator:ready` сигналізує, що плеєр повністю ініціалізований і API готовий:

```javascript
// Всередині PlayCanvas (якщо пишете скрипт у проекті)
app.on('configurator:ready', () => {
  // ConfiguratorAPI доступний
});
```

---

## 9. Available Configuration Options <a id="available-options"></a>

### Поточний стан конфігурації (Lippert project)

| Ключ | Тип | Default | Опис |
|------|-----|---------|------|
| `explodeStatus` | `boolean` | `false` | Розібрати/зібрати модель (анімація) |
| `hubAssemblyVisible` | `boolean` | `true` | Видимість Hub Assembly |
| `spindleAssemblyVisible` | `boolean` | `true` | Видимість Spindle Assembly |
| `springAssemblyVisible` | `boolean` | `true` | Видимість Spring Assembly |
| `brakeAssemblyVisible` | `boolean` | `true` | Видимість Brake Assembly |
| `cameraPosition` | `string` | `'iso'` | Пресет камери: `top`, `front`, `left`, `right`, `back`, `iso` |
| `annotationsVisible` | `boolean` | `false` | Показати нумеровані підписи деталей |

---

## 10. Integration Patterns & Examples <a id="integration-patterns"></a>

### Приклад: React-інтеграція

```jsx
import { useEffect, useState, useCallback, useRef } from 'react';

function useConfiguratorAPI() {
  const [api, setApi] = useState(null);
  const [state, setState] = useState(null);

  useEffect(() => {
    // Дочекатись ініціалізації API
    const interval = setInterval(() => {
      if (window.ConfiguratorAPI) {
        clearInterval(interval);
        const configurator = window.ConfiguratorAPI;
        setApi(configurator);
        setState(configurator.getConfig());

        // Підписатись на зміни стану
        configurator.subscribe((newState) => {
          setState({ ...newState });
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return { api, state };
}

// Компонент контролів
function ConfiguratorControls() {
  const { api, state } = useConfiguratorAPI();

  if (!api || !state) return <div>Loading configurator...</div>;

  return (
    <div className="controls">
      {/* Explode toggle */}
      <button onClick={() => api.setConfig({ explodeStatus: !state.explodeStatus })}>
        {state.explodeStatus ? 'Collapse' : 'Explode'}
      </button>

      {/* Assembly visibility */}
      <label>
        <input
          type="checkbox"
          checked={state.hubAssemblyVisible}
          onChange={(e) => api.setConfig({ hubAssemblyVisible: e.target.checked })}
        />
        Hub Assembly
      </label>

      {/* Camera presets */}
      <select
        value={state.cameraPosition}
        onChange={(e) => api.setConfig({ cameraPosition: e.target.value })}
      >
        <option value="iso">Isometric</option>
        <option value="front">Front</option>
        <option value="top">Top</option>
        <option value="left">Left</option>
        <option value="right">Right</option>
        <option value="back">Back</option>
      </select>

      {/* Annotations */}
      <button onClick={() => api.setConfig({ annotationsVisible: !state.annotationsVisible })}>
        {state.annotationsVisible ? 'Hide Labels' : 'Show Labels'}
      </button>

      {/* Reset */}
      <button onClick={() => api.resetConfig()}>Reset All</button>
    </div>
  );
}
```

### Приклад: Vanilla JS (з iframe)

```html
<iframe id="player" src="https://playcanv.as/p/PROJECT_ID/"></iframe>

<div id="controls">
  <button id="btn-explode">Explode</button>
  <button id="btn-annotations">Show Labels</button>
  <select id="select-camera">
    <option value="iso">Isometric</option>
    <option value="front">Front</option>
    <option value="top">Top</option>
    <option value="left">Left</option>
    <option value="right">Right</option>
    <option value="back">Back</option>
  </select>
</div>

<script>
  const frame = document.getElementById('player');

  frame.addEventListener('load', () => {
    const api = frame.contentWindow.ConfiguratorAPI;
    if (!api) {
      console.warn('API not ready, retry...');
      return;
    }

    // Sync UI with state
    const syncUI = (state) => {
      document.getElementById('btn-explode').textContent =
        state.explodeStatus ? 'Collapse' : 'Explode';
      document.getElementById('btn-annotations').textContent =
        state.annotationsVisible ? 'Hide Labels' : 'Show Labels';
      document.getElementById('select-camera').value = state.cameraPosition;
    };

    // Initial sync
    syncUI(api.getConfig());

    // Subscribe to changes
    api.subscribe((newState) => syncUI(newState));

    // Event handlers
    document.getElementById('btn-explode').onclick = () => {
      const current = api.getConfig();
      api.setConfig({ explodeStatus: !current.explodeStatus });
    };

    document.getElementById('btn-annotations').onclick = () => {
      const current = api.getConfig();
      api.setConfig({ annotationsVisible: !current.annotationsVisible });
    };

    document.getElementById('select-camera').onchange = (e) => {
      api.setConfig({ cameraPosition: e.target.value });
    };
  });
</script>
```

### Приклад: Динамічна генерація UI з метаданих

```javascript
const api = window.ConfiguratorAPI;
const options = api.getAvailableOptions();
const container = document.getElementById('auto-controls');

for (const [key, meta] of Object.entries(options)) {
  if (meta.type === 'boolean') {
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = api.getConfig()[key];
    checkbox.onchange = () => api.setConfig({ [key]: checkbox.checked });
    label.append(checkbox, ` ${key}`);
    container.append(label);
  }

  if (meta.type === 'string' && meta.options) {
    const select = document.createElement('select');
    for (const opt of meta.options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.append(option);
    }
    select.value = api.getConfig()[key];
    select.onchange = () => api.setConfig({ [key]: select.value });
    container.append(select);
  }
}

// Keep UI in sync when state changes externally
api.subscribe((state) => {
  for (const input of container.querySelectorAll('input[type=checkbox]')) {
    const key = input.parentElement.textContent.trim();
    if (key in state) input.checked = state[key];
  }
});
```

### Приклад: BOM-список деталей з інтерактивним виділенням

```javascript
const api = window.ConfiguratorAPI;
const groups = api.outline.getGroups();
const list = document.getElementById('parts-list');

groups.forEach((group) => {
  const row = document.createElement('div');
  row.className = 'part-row';
  row.innerHTML = `
    <span class="item-num">${group.itemNumber}</span>
    <span class="part-name">${group.groupName}</span>
    <span class="part-number">${group.partNumber}</span>
  `;

  // Hover → 3D highlight
  row.addEventListener('mouseenter', () => {
    api.outline.highlightGroup(group.groupName);
  });
  row.addEventListener('mouseleave', () => {
    api.outline.clearHighlight();
  });

  // Click → 3D selection
  row.addEventListener('click', () => {
    api.outline.selectGroup(group.groupName);
  });

  list.append(row);
});
```

### Приклад: Зберігання та відновлення стану (permalink / share)

```javascript
// Зберегти стан в URL
function saveStateToURL() {
  const state = ConfiguratorAPI.getConfig();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(state)) {
    params.set(key, String(value));
  }
  history.replaceState(null, '', '?' + params.toString());
}

// Відновити стан з URL
function restoreStateFromURL() {
  const params = new URLSearchParams(location.search);
  const config = {};
  for (const [key, value] of params.entries()) {
    if (value === 'true') config[key] = true;
    else if (value === 'false') config[key] = false;
    else config[key] = value;
  }
  if (Object.keys(config).length > 0) {
    ConfiguratorAPI.setConfig(config);
  }
}
```

---

## 11. Debug Mode <a id="debug-mode"></a>

Додайте `?debug=true` до URL плеєра для активації debug-панелі з автоматично згенерованими контролами:

```
https://playcanv.as/p/PROJECT_ID/?debug=true
```

Можна комбінувати з іншими параметрами:

```
?debug=true&logLevel=debug    — детальне логування
?debug=true&local=true        — локальна розробка + debug
```

---

## 12. Troubleshooting <a id="troubleshooting"></a>

### `window.ConfiguratorAPI` is `undefined`

- Плеєр ще не завантажився — використовуйте polling або подію `configurator:ready`
- При iframe: перевірте CORS та same-origin policy

### `setConfig()` не працює

- Переконайтесь, що передаєте об'єкт: `setConfig({ key: value })`, не `setConfig(key, value)`
- `setConfig` — async, використовуйте `await`

### Камера не реагує

- Перевірте `ConfiguratorAPI.camera.setInputEnabled(true)` — ввід може бути вимкнений
- При iframe: canvas всередині iframe має бути в фокусі

### Cross-origin iframe доступ

При використанні iframe з іншого домену, прямий доступ до `frame.contentWindow.ConfiguratorAPI` заблоковано. Використовуйте `postMessage`:

```javascript
// З client UI
frame.contentWindow.postMessage({
  type: 'configurator:setConfig',
  payload: { explodeStatus: true }
}, '*');

// Всередині PlayCanvas (потребує додаткового скрипта)
window.addEventListener('message', async (e) => {
  if (e.data?.type === 'configurator:setConfig') {
    await ConfiguratorAPI.setConfig(e.data.payload);
  }
});
```

---

## API Quick Reference Card

```
ConfiguratorAPI
├── setConfig(partial)              → Promise<void>
├── getConfig()                     → ConfigState
├── subscribe(cb)                   → () => void (unsubscribe)
├── getAvailableOptions()           → OptionsMetadata
├── resetConfig()                   → Promise<void>
│
├── camera
│   ├── getYaw() / setYaw(v)
│   ├── getPitch() / setPitch(v)
│   ├── getDistance() / setDistance(v)
│   ├── getPivotPoint() / setPivotPoint(x,y,z)
│   ├── reset(yaw, pitch, distance)
│   ├── focus(entityName)
│   ├── transitionTo(id, options)
│   ├── cancelTransition()
│   ├── resetToDefault(options)
│   ├── isTransitioning()
│   ├── setMouseInputEnabled(bool)
│   ├── setTouchInputEnabled(bool)
│   ├── setInputEnabled(bool)
│   ├── getAutoOrbitSpeed() / setAutoOrbitSpeed(v)
│   ├── getIdleAutoOrbitDelay() / setIdleAutoOrbitDelay(v)
│   ├── getDistanceMin/Max() / setDistanceMin/Max(v)
│   ├── getPitchAngleMin/Max() / setPitchAngleMin/Max(v)
│   ├── getPosition()              → {x, y, z}
│   └── getForward()               → {x, y, z}
│
├── outline
│   ├── getGroups()                → Array<PartGroup>
│   ├── getSelectedGroup()         → PartGroup | null
│   ├── selectGroup(name)
│   ├── deselect()
│   ├── highlightGroup(name)
│   └── clearHighlight()
│
└── annotations
    ├── show()
    ├── hide()
    └── isVisible()                → boolean
```
