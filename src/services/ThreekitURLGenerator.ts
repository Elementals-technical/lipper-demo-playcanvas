// ThreekitURLGenerator.ts

export interface ThreekitURLGeneratorOptions {
  assetId: string;
  orgId: string;
  display: string;
  /** Можна числа або рядки — буде приведено до string у запиті */
  height?: number | string;
  width?: number | string;
  /** Напр. 'png' | 'jpg' | 'webp' — залишаю string, якщо бек приймає інше */
  format?: string;
  /** токен (назва поле збережена як у вихідному коді) */
  bearer_token: string;
  stageId?: string;
  configuration?: Record<string, unknown>;
  stageConfiguration?: Record<string, unknown>;
  /** Тривалість кешу (години), за замовчуванням 168 = 1 тиждень */
  cacheDurationHours?: number;
  /** Можна перевизначити базовий URL */
  baseUrl?: string;
}

export default class ThreekitURLGenerator {
  public assetId: string;
  public orgId: string;
  public display: string;
  public height?: number | string;
  public width?: number | string;
  public format?: string;
  public bearer_token: string;
  public stageId?: string;
  public configuration?: Record<string, unknown>;
  public stageConfiguration?: Record<string, unknown>;
  public baseUrl: string;
  public cacheDurationHours: number;

  constructor({
    assetId,
    orgId,
    display,
    height,
    width,
    format,
    bearer_token,
    stageId,
    configuration,
    stageConfiguration,
    cacheDurationHours = 171,
    baseUrl = "https://preview.threekit.com/api/fast-compositor/",
  }: ThreekitURLGeneratorOptions) {
    this.assetId = assetId;
    this.orgId = orgId;
    this.display = display;
    this.height = height;
    this.width = width;
    this.format = format;
    this.bearer_token = bearer_token;
    this.stageId = stageId;
    this.configuration = configuration;
    this.stageConfiguration = stageConfiguration;
    this.baseUrl = baseUrl;
    this.cacheDurationHours = cacheDurationHours;
  }

  /** Генерує cacheKey з урахуванням тривалості кешу (в годинах) та localStorage */
  generateCacheKey(): string {
    const cacheMs = 1000 * 60 * 60 * this.cacheDurationHours;
    const now = Date.now();

    if (typeof window === "undefined" || !window.localStorage) {
      return String(Math.floor(now / cacheMs));
    }

    const keyName = `threekit_cacheKey_${this.cacheDurationHours}`;
    const tsName = `${keyName}_timestamp`;

    const storedKey = localStorage.getItem(keyName);
    const storedTs = localStorage.getItem(tsName);

    if (!storedKey || !storedTs || now - Number(storedTs) > cacheMs) {
      const newKey = Math.floor(now / cacheMs).toString();
      localStorage.setItem(keyName, newKey);
      localStorage.setItem(tsName, now.toString());
      return newKey;
    }

    return storedKey;
  }

  /** Генерує URL для Fast Compositor API */
  generateURL(): string {
    const params = new URLSearchParams();

    params.append("assetId", this.assetId);
    params.append("orgId", this.orgId);
    params.append("display", this.display);
    params.append("bearer_token", this.bearer_token);
    if (this.stageId) params.append("stageId", this.stageId);
    if (this.height != null) params.append("height", String(this.height));
    if (this.width != null) params.append("width", String(this.width));
    if (this.format) params.append("format", this.format);

    // cacheKey, що оновлюється з заданою періодичністю
    params.append("cacheKey", this.generateCacheKey());

    if (this.configuration) {
      params.append("configuration", JSON.stringify(this.configuration));
    }
    if (this.stageConfiguration) {
      params.append("stageConfiguration", JSON.stringify(this.stageConfiguration));
    }

    // гарантуємо слеш наприкінці, щоб `${base}?` був коректним
    const base = this.baseUrl.endsWith("/") ? this.baseUrl : `${this.baseUrl}/`;
    return `${base}?${params.toString()}`;
  }

  /** Статичний метод для ручного очищення кешу Fast Compositor фото (для всіх тривалостей) */
  static clearFastCompositorImageCache(): void {
    if (typeof window === "undefined" || !window.localStorage) return;

    // обходимо ключі без Object.keys(localStorage) для кращої сумісності типів
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("threekit_cacheKey_")) {
        localStorage.removeItem(key);
      }
    }
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("threekit_cacheKey_") && key.endsWith("_timestamp")) {
        localStorage.removeItem(key);
      }
    }
  }
}

// Додаємо метод до window для ручного виклику з консолі
declare global {
  interface Window {
    clearFastCompositorImageCache?: () => void;
  }
}

if (typeof window !== "undefined") {
  window.clearFastCompositorImageCache = ThreekitURLGenerator.clearFastCompositorImageCache;
}
