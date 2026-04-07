/**
 * PlayCanvas Helper Utilities
 * Допоміжні функції для роботи з PlayCanvas
 */

import type { RenderData } from '../types/playcanvas.types';

/**
 * Генерує URL для PlayCanvas ресурсів
 */
export const generatePlayCanvasUrls = (
  baseUrl: string,
  idProject: string,
  idProduct: string
): {
  base: string;
  scripts: string[];
  styles: Array<{ rel: string; href: string; type?: string }>;
} => {
  const base = `${baseUrl}/projects/${idProject}/products/${idProduct}/playcanvas/`;

  return {
    base,
    scripts: [
      `${base}playcanvas-stable.min.js`,
      `${base}__settings__.js`,
      `${base}__start__.js`,
      `${base}__loading__.js`,
    ],
    styles: [
      {
        rel: 'stylesheet',
        type: 'text/css',
        href: `${base}styles.css`,
      },
      {
        rel: 'manifest',
        href: `${base}manifest.json`,
      },
    ],
  };
};

/**
 * Перетворює об'єкт renderData в масив
 * Реалізація відповідає оригінальній renderDataToArray функції
 */
export const transformRenderDataToArray = (
  renderData: RenderData
): Array<{ name: string; val: number | string | boolean }> => {
  return Object.keys(renderData).map((key) => ({
    name: key,
    val: renderData[key] as number | string | boolean,
  }));
};

/**
 * Створює конфігурацію для API
 * Реалізація відповідає оригінальній getConfigForApi функції
 */
export const buildConfigForApi = async (params: {
  body: Array<{ name: string; val: number | string | boolean }>;
  products?: any[];
  currentCamera?: number;
  idProduct?: string | number;
}): Promise<any> => {
  const { body, products, currentCamera, idProduct } = params;

  if (!products || products.length === 0) {
    console.warn('No products provided to buildConfigForApi');
    return null;
  }

  // Сортуємо body в об'єкт для зручного доступу
  const sortedArray: Record<string, any> = {};
  body.forEach((item) => {
    sortedArray[item.name] = item.val;
  });

  // Знаходимо активний продукт
  const activeProduct = products.find((item: any) => {
    return item.id === Number(idProduct);
  });

  // Safety check for activeProduct
  if (!activeProduct) {
    console.warn(
      `Active product not found for id: ${idProduct}. Available products:`,
      products.map((p: any) => ({ id: p.id, name: p.name }))
    );
    return null;
  }

  // Сортуємо конфігурацію за ключами
  const configArray = sortConfigByKey(body, activeProduct);

  const activeCamera =
    activeProduct?.availableStages?.[sortedArray.bg]?.cameras?.[
      sortedArray.camera
    ];

  const stage = activeProduct?.availableStages?.[sortedArray.bg];

  // Safety check for stage
  if (!stage) {
    console.warn(
      `Stage not found for bg: ${sortedArray.bg}`,
      activeProduct.availableStages
    );
    return null;
  }

  // Skip config generation if options are empty but product has available options
  if (configArray.length === 0 && activeProduct.availableOptions?.length > 0) {
    console.log('Skipping config: waiting for options to be initialized');
    return null;
  }

  const productConfig = {
    id: activeProduct.id,
    name: activeProduct.name,
    projectId: activeProduct.projectId,
    paramString: activeProduct.paramString,
    resourceUrl: activeProduct.resource,
    options: [...configArray],
  };

  return {
    config: {
      stage: {
        id: stage.id,
        name: stage.name,
        paramString: stage.paramString,
        resourceUrl: stage.resource,
      },
      camera: {
        ...activeCamera,
        '360steps': {
          total: activeCamera.rotationSteps,
          current: currentCamera ? currentCamera : 1,
        },
      },
      products: [productConfig],
    },
  };
};

/**
 * Допоміжна функція для сортування конфігурації за ключами
 */
function sortConfigByKey(
  body: Array<{ name: string; val: any }>,
  activeProduct: any
): any[] {
  const allConfigArr: any[] = [];

  body.forEach((item) => {
    // Пропускаємо системні поля
    if (
      item.name !== 'bg' &&
      item.name !== 'camera' &&
      item.name !== 'camera_rotation'
    ) {
      const options = activeProduct.availableOptions.find(
        (option: any) => option.proxyName === item.name
      );

      if (!options) {
        console.warn(`Option not found for proxyName: ${item.name}`);
        return;
      }

      const optionIds: any = {};
      if (options.type === 'geometry') {
        optionIds.optionId = options.geometryOptionId;
        optionIds.requirements = options.requirements;
      }

      const variants = options.options.flatMap((option: any) =>
        option.variants.flat()
      );

      const activeVariant = variants[item.val as number];

      if (!activeVariant) {
        console.warn(
          `Variant not found at index ${item.val} for option ${item.name}`
        );
        return;
      }

      const actionOption = options.options.find((option: any) =>
        option.variants.some((variant: any) => variant.id === activeVariant.id)
      );

      if (!actionOption) {
        console.warn(`Action option not found for variant ${activeVariant.id}`);
        return;
      }

      allConfigArr.push({
        name: actionOption.name,
        layerOrder: options.layerOrder,
        shadow: options.shadow,
        shadowEnabled: options.shadowEnabled,
        proxyName: options.proxyName,
        type: options.type,
        paramString: actionOption.paramString,
        dependencies: options.dependencies,
        proxyOptionId: options.id,
        val: activeVariant.id,
        resourceUrl: actionOption.resource,
        valName: activeVariant.name,
      });
    }
  });

  return allConfigArr.sort((a, b) => a.layerOrder - b.layerOrder);
}

/**
 * Налаштування crossOrigin для зображень
 */
export const setupImageCrossOrigin = (): (() => void) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'IMG') {
            (node as HTMLImageElement).crossOrigin = 'anonymous';
          }
        });
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Повертаємо функцію для відключення observer
  return () => observer.disconnect();
};

/**
 * Завантаження одного скрипта
 */
export const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Перевіряємо чи скрипт вже завантажений
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));

    document.body.appendChild(script);
  });
};

/**
 * Послідовне завантаження масиву скриптів
 */
export const loadScriptsSequentially = async (
  scripts: string[]
): Promise<void> => {
  for (const src of scripts) {
    await loadScript(src);
  }
};

/**
 * Додавання link елемента
 */
export const addLinkElement = (link: {
  rel: string;
  href: string;
  type?: string;
}): HTMLLinkElement => {
  // Перевіряємо чи link вже існує
  const existing = document.querySelector(`link[href="${link.href}"]`);
  if (existing) {
    return existing as HTMLLinkElement;
  }

  const linkElement = document.createElement('link');
  linkElement.rel = link.rel;
  if (link.type) {
    linkElement.type = link.type;
  }
  linkElement.href = link.href;

  document.head.appendChild(linkElement);
  return linkElement;
};

/**
 * Видалення скрипта
 */
export const removeScript = (src: string): void => {
  const script = document.querySelector(`script[src="${src}"]`);
  if (script && script.parentNode) {
    script.parentNode.removeChild(script);
  }
};

/**
 * Видалення link елемента
 */
export const removeLink = (href: string): void => {
  const link = document.querySelector(`link[href="${href}"]`);
  if (link && link.parentNode) {
    link.parentNode.removeChild(link);
  }
};

/**
 * Cleanup функція для видалення всіх ресурсів PlayCanvas
 */
export const cleanupPlayCanvasResources = (urls: {
  scripts: string[];
  styles: Array<{ href: string }>;
}): void => {
  // Видаляємо скрипти
  urls.scripts.forEach(removeScript);

  // Видаляємо стилі
  urls.styles.forEach((style) => removeLink(style.href));
};

/**
 * Дебаунс функція
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), waitMs);
  };
};

/**
 * Створення унікального ID
 */
export const generateUniqueId = (prefix: string = 'playcanvas'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Безпечне отримання значення з об'єкта
 */
export const safeGet = <T>(obj: unknown, path: string, defaultValue: T): T => {
  const keys = path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (result?.[key] === undefined) {
      return defaultValue;
    }
    result = result[key];
  }

  return result as T;
};

/**
 * Логування з timestamp
 */
export const log = (message: string, ...args: any[]): void => {
  const timestamp = new Date().toISOString();
  console.log(`[PlayCanvas ${timestamp}] ${message}`, ...args);
};

/**
 * Логування помилок
 */
export const logError = (message: string, error?: Error | unknown): void => {
  const timestamp = new Date().toISOString();
  console.error(`[PlayCanvas ERROR ${timestamp}] ${message}`, error);
};
