/**
 * PlayCanvas Service
 * Сервіс для роботи з PlayCanvas API та конфігурацією
 */

import type {
  PlayCanvasWindow,
  RetryOptions,
  ConfigResult,
} from '../types/playcanvas.types';

/**
 * Дефолтні налаштування retry
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 500,
  backoffMultiplier: 2,
};

/**
 * Клас для роботи з PlayCanvas
 */
export class PlayCanvasService {
  private window: PlayCanvasWindow;
  private retryOptions: Required<RetryOptions>;

  constructor(retryOptions?: RetryOptions) {
    this.window = window as PlayCanvasWindow;
    this.retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };
  }

  /**
   * Перевірка готовності PlayCanvas
   */
  public isPlayCanvasReady(): boolean {
    return !!(this.window.applyConfig && this.window.pc?.app?.scene?.root);
  }

  /**
   * Очікування готовності PlayCanvas з таймаутом
   */
  public async waitForReady(timeoutMs: number = 10000): Promise<boolean> {
    const startTime = Date.now();

    while (!this.isPlayCanvasReady()) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error('PlayCanvas initialization timeout');
      }
      await this.delay(100);
    }

    return true;
  }

  /**
   * Застосування конфігурації до PlayCanvas
   */
  public async applyConfig(
    config: unknown,
    debugPrefix?: string
  ): Promise<ConfigResult> {
    if (debugPrefix) {
      console.log(`${debugPrefix} Applying config:`, config);
    }

    try {
      await this.waitForReady();

      if (!this.window.applyConfig) {
        throw new Error('applyConfig function not available');
      }

      await this.window.applyConfig(config);

      if (debugPrefix) {
        console.log(`${debugPrefix} Config applied successfully`);
      }

      return {
        success: true,
        config,
      };
    } catch (error) {
      console.error('Failed to apply config:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Застосування конфігурації з retry механізмом
   */
  public async applyConfigWithRetry(
    config: unknown,
    debugPrefix?: string
  ): Promise<ConfigResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.retryOptions.maxAttempts; attempt++) {
      const attemptPrefix = debugPrefix
        ? `${debugPrefix} [Attempt ${attempt}/${this.retryOptions.maxAttempts}]`
        : `[Attempt ${attempt}/${this.retryOptions.maxAttempts}]`;

      const result = await this.applyConfig(config, attemptPrefix);

      if (result.success) {
        return result;
      }

      lastError = result.error;

      // Не чекаємо після останньої спроби
      if (attempt < this.retryOptions.maxAttempts) {
        const delayMs =
          this.retryOptions.delay *
          Math.pow(this.retryOptions.backoffMultiplier, attempt - 1);

        console.warn(
          `${attemptPrefix} Failed, retrying in ${delayMs}ms...`,
          lastError
        );

        await this.delay(delayMs);
      }
    }

    return {
      success: false,
      error:
        lastError || new Error('Config application failed after all retries'),
    };
  }

  /**
   * Очистка кешу (legacy support)
   */
  public clearCache(): void {
    this.window.cacheInfo = '';
  }

  /**
   * Перевірка чи PlayCanvas app ініціалізований
   */
  public isAppInitialized(): boolean {
    return this.window.pc?.app?._initialized ?? false;
  }

  /**
   * Утиліта для затримки
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Отримання інформації про стан PlayCanvas
   */
  public getStatus(): {
    ready: boolean;
    hasApplyConfig: boolean;
    hasPC: boolean;
    hasScene: boolean;
    appInitialized: boolean;
  } {
    return {
      ready: this.isPlayCanvasReady(),
      hasApplyConfig: !!this.window.applyConfig,
      hasPC: !!this.window.pc,
      hasScene: !!this.window.pc?.app?.scene,
      appInitialized: this.isAppInitialized(),
    };
  }
}

/**
 * Singleton instance
 */
let serviceInstance: PlayCanvasService | null = null;

/**
 * Отримання або створення екземпляра сервісу
 */
export const getPlayCanvasService = (
  retryOptions?: RetryOptions
): PlayCanvasService => {
  if (!serviceInstance) {
    serviceInstance = new PlayCanvasService(retryOptions);
  }
  return serviceInstance;
};

/**
 * Скидання singleton (для тестів або реініціалізації)
 */
export const resetPlayCanvasService = (): void => {
  serviceInstance = null;
};

export default PlayCanvasService;
