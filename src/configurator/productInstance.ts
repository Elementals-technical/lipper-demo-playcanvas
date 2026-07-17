import { ProductAttributesService } from '../services/productAttributes';

export const DEFAULT_PRODUCT_ID = 2669;

export const lippertProductService = new ProductAttributesService({
  apiBaseUrl: 'https://renderadmin.vivid3d.tech',
  productId: DEFAULT_PRODUCT_ID,
});
