/**
 * PlayCanvas Player Types
 * Автономні типи для роботи з PlayCanvas плеєром
 */

/**
 * Базова конфігурація PlayCanvas плеєра
 */
export interface PlayCanvasConfig {
  /** ID проекту */
  idProject: string;
  /** ID продукту */
  idProduct: string;
  /** Базовий URL для завантаження ресурсів (опціонально) */
  baseUrl?: string;
}

/**
 * Дані рендеру для конфігурації сцени
 */
export interface RenderData {
  [key: string]: number | string | boolean | undefined;
}

/**
 * Розширений Window об'єкт з PlayCanvas API
 */
export interface PlayCanvasWindow extends Window {
  /** Функція застосування конфігурації */
  applyConfig?: (config: unknown) => Promise<void> | void;
  /** PlayCanvas engine instance */
  pc?: {
    app?: {
      scene?: {
        root?: unknown;
      };
      /** Прапорець готовності додатку */
      _initialized?: boolean;
    };
  };
  /** Кеш інформація (legacy) */
  cacheInfo?: string;
}

/**
 * Статус завантаження PlayCanvas
 */
export enum LoadingStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  READY = 'ready',
  ERROR = 'error',
}

/**
 * Параметри для застосування конфігурації
 */
export interface ApplyConfigParams {
  /** Дані рендеру */
  renderData: RenderData;
  /** Список продуктів */
  products?: unknown[];
  /** Префікс для дебагу */
  debugPrefix?: string;
}

/**
 * Результат застосування конфігурації
 */
export interface ConfigResult {
  /** Чи успішно застосовано */
  success: boolean;
  /** Конфігурація, що була застосована */
  config?: unknown;
  /** Помилка, якщо виникла */
  error?: Error;
}

/**
 * Налаштування retry механізму
 */
export interface RetryOptions {
  /** Максимальна кількість спроб */
  maxAttempts?: number;
  /** Затримка між спробами (мс) */
  delay?: number;
  /** Множник затримки для експоненціального backoff */
  backoffMultiplier?: number;
}

/**
 * Параметри для завантаження скриптів
 */
export interface ScriptLoadOptions {
  /** Список URL скриптів */
  scripts: string[];
  /** Список стилів для завантаження */
  styles?: Array<{
    rel: string;
    href: string;
    type?: string;
  }>;
  /** Callback після успішного завантаження */
  onLoad?: () => void;
  /** Callback при помилці */
  onError?: (error: Error) => void;
}

/**
 * Контекст PlayCanvas провайдера
 */
export interface PlayCanvasContextValue {
  /** Поточний статус завантаження */
  status: LoadingStatus;
  /** Чи готовий PlayCanvas до роботи */
  isReady: boolean;
  /** Функція застосування конфігурації */
  applyConfig: (params: ApplyConfigParams) => Promise<ConfigResult>;
  /** Функція оновлення окремого параметра */
  updateValue: (
    key: string,
    value: number | string | boolean
  ) => Promise<ConfigResult>;
  /** Поточна помилка (якщо є) */
  error: Error | null;
  /** Поточна конфігурація */
  config: PlayCanvasConfig;
}

/**
 * Props для PlayCanvas Player компонента
 */
export interface PlayCanvasPlayerProps {
  /** ID проекту */
  idProject: string;
  /** ID продукту */
  idProduct: string;
  /** Базовий URL (опціонально, за замовчуванням з environment service) */
  baseUrl?: string;
  /** Початкові дані рендеру */
  initialRenderData?: RenderData;
  /** Список продуктів для конфігурації */
  products?: unknown[];
  /** Callback при готовності плеєра */
  onReady?: () => void;
  /** Callback при помилці */
  onError?: (error: Error) => void;
  /** Callback при застосуванні конфігурації */
  onConfigApplied?: (config: unknown) => void;
  /** CSS клас для контейнера */
  className?: string;
  /** ID для контейнера */
  containerId?: string;
  /** Налаштування retry */
  retryOptions?: RetryOptions;
}
