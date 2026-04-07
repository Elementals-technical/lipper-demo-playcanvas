import { ProductAttributesService } from '../services/productAttributes';

export const PRODUCT_ID = 2669;

export const lippertProductService = new ProductAttributesService({
  apiBaseUrl: 'https://renderadmin.vivid3d.tech',
  productId: PRODUCT_ID,
});
