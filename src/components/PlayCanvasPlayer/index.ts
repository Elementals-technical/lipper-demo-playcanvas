/**
 * PlayCanvas Player Module
 * Головний експорт модуля
 */

// Components
export { PlayCanvasPlayer } from './components/PlayCanvasPlayer';

// Context
export {
  PlayCanvasProvider,
  usePlayCanvas,
  usePlayCanvasOptional,
} from './context/PlayCanvasContext';

// Hooks
export { usePlayCanvasLoader } from './hooks/usePlayCanvasLoader';
export { usePlayCanvasConfig } from './hooks/usePlayCanvasConfig';
export { useScriptLoader } from './hooks/useScriptLoader';

// Services
export {
  PlayCanvasService,
  getPlayCanvasService,
  resetPlayCanvasService,
} from './services/playcanvas.service';

// Types
export type {
  PlayCanvasConfig,
  RenderData,
  PlayCanvasWindow,
  LoadingStatus,
  ApplyConfigParams,
  ConfigResult,
  RetryOptions,
  ScriptLoadOptions,
  PlayCanvasContextValue,
  PlayCanvasPlayerProps,
} from './types/playcanvas.types';

export type {
  Variant,
  Option,
  AvailableOption,
  Camera,
  Stage,
  Product,
  ConfigLayer,
  ProductConfig,
  PlayCanvasApiConfig,
  GetConfigParams,
  SortedRenderData,
} from './types/product.types';

export { LoadingStatus as PlayCanvasLoadingStatus } from './types/playcanvas.types';

// Utils
export {
  generatePlayCanvasUrls,
  transformRenderDataToArray,
  buildConfigForApi,
  setupImageCrossOrigin,
  loadScript,
  loadScriptsSequentially,
  cleanupPlayCanvasResources,
} from './utils/playcanvas.helpers';
