/**
 * Extended Types for Product Configuration
 * Розширені типи для роботи з продуктами та конфігурацією
 */

/**
 * Варіант опції (напр. різні кольори рамки)
 */
export interface Variant {
  id: number;
  name: string;
  image: string | null;
  enabled: boolean;
}

/**
 * Опція з варіантами (напр. "Frame" з варіантами Silver, Gold)
 */
export interface Option {
  id: number;
  name: string;
  requirements: any[];
  paramString: string;
  playcanvasString: string;
  variants: Variant[];
  resource?: string;
}

/**
 * Група опцій (geometry або standard)
 */
export interface AvailableOption {
  id: number;
  proxyName: string;
  dependencies: any[];
  layerOrder: number;
  shadow: number;
  shadowEnabled: boolean;
  enabled: boolean;
  options: Option[];
  type: 'geometry' | 'standard';
  variants: any[];
  geometryOptionId?: number;
  requirements?: any[];
}

/**
 * Camera configuration
 */
export interface Camera {
  id: number;
  name: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    roll: number;
    pitch: number;
    yaw: number;
  };
  productRotation: {
    roll: number;
    pitch: number;
    yaw: number;
  };
  rotationAngle: number;
  backgroundType: string;
  backgroundColor: string;
  renderShadow: boolean;
  renderDimensions: boolean;
  dimensionsColor: string;
  lineOffset: number;
  lineWidth: number;
  capsLength: number;
  fontSize: number;
  fontName: string;
  fovCorrection: number;
  fov: number;
  rotationSteps: number;
  rotationType: string;
  exposure: number | null;
  nearClipPlane: number;
  renderHeight: number;
  renderWidth: number;
  imageHeight: number;
  imageWidth: number;
  renderType: string;
  imageType: string;
  quality: number;
  renderWarmup: number;
  antiAliasing: string;
  paramString: string;
  enabled: boolean;
  order: number;
}

/**
 * Stage (background/scene)
 */
export interface Stage {
  id: number;
  name: string;
  resource: string;
  enabled: boolean;
  paramString: string;
  cameras: Camera[];
  availableOptions: any[];
  availableGeometryOptions: any[];
}

/**
 * Product (повна структура продукту)
 */
export interface Product {
  id: number;
  name: string;
  resource: string;
  paramString: string;
  playcanvasString: string;
  imgCover: string | null;
  glbBundle: string | null;
  layeredRender: boolean;
  useCompositor: boolean;
  playcanvas: string;
  enabled: boolean;
  studio: boolean;
  projectId: number;
  availableStages: Stage[];
  availableOptions: AvailableOption[];
  availableGeometryOptions: AvailableOption[];
  availableStandardOptions: any[];
  isCompositor: boolean;
}

/**
 * Об'єкт конфігурації для одного layer
 */
export interface ConfigLayer {
  name: string;
  layerOrder: number;
  shadow: number;
  shadowEnabled: boolean;
  proxyName: string;
  type: string;
  paramString: string;
  dependencies: any[];
  proxyOptionId: number;
  val: number;
  resourceUrl?: string;
  valName: string;
}

/**
 * Product config для API
 */
export interface ProductConfig {
  id: number;
  name: string;
  projectId: number;
  paramString: string;
  resourceUrl: string;
  options: ConfigLayer[];
}

/**
 * Фінальна конфігурація для PlayCanvas API
 */
export interface PlayCanvasApiConfig {
  config: {
    stage: {
      id: number;
      name: string;
      paramString: string;
      resourceUrl: string;
    };
    camera: Camera & {
      '360steps': {
        total: number;
        current: number;
      };
    };
    products: ProductConfig[];
  };
}

/**
 * Параметри для getConfigForApi
 */
export interface GetConfigParams {
  body: Array<{ name: string; val: number }>;
  products: Product[];
  currentCamera?: number;
  idProduct?: string | number;
}

/**
 * Sorted render data
 */
export interface SortedRenderData {
  bg: number;
  camera: number;
  camera_rotation: number;
  [key: string]: number;
}
