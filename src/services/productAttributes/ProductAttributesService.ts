import type {
  ProductAttributesConfig,
  ProductDataAttributes,
  ProductData,
  AvailableOption,
  AvailableGeometryOption,
} from './types';

export class ProductAttributesService {
  private apiBaseUrl: string;
  private productId: number;
  private cache = new Map<number, Record<string, ProductDataAttributes>>();

  constructor(config: ProductAttributesConfig) {
    this.apiBaseUrl = config.apiBaseUrl.replace(/\/$/, '');
    this.productId = config.productId;
  }

  public async getAttributes(
    productId?: number,
    useCache = true,
  ): Promise<Record<string, ProductDataAttributes>> {
    const id = productId ?? this.productId;

    if (useCache && this.cache.has(id)) {
      return this.cache.get(id)!;
    }

    const productData = await this.fetchProductData(id);
    if (!productData) return {};

    const optionGroups = (productData.availableOptions || []).map((g) => ({
      group: g,
      type: 'option' as const,
    }));
    const geometryGroups = (productData.availableGeometryOptions || []).map(
      (g) => ({ group: g, type: 'geometry' as const }),
    );

    const result = [...optionGroups, ...geometryGroups].reduce<
      Record<string, ProductDataAttributes>
    >((acc, { group, type }) => {
      const transformed = this.transformOptions(group, type);
      return { ...acc, ...transformed };
    }, {});

    this.cache.set(id, result);
    return result;
  }

  private async fetchProductData(
    productId: number,
  ): Promise<ProductData | null> {
    try {
      const res = await fetch(`${this.apiBaseUrl}/products/${productId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      return null;
    }
  }

  private transformOptions(
    data: AvailableOption | AvailableGeometryOption,
    type: 'option' | 'geometry',
  ): Record<string, ProductDataAttributes> {
    const result: Record<string, ProductDataAttributes> = {};

    data.options.forEach((item) => {
      result[item.name] = {
        id: item.id,
        name: data.proxyName,
        type,
        values: item.variants.map((variant) => ({
          id: variant.id,
          name: variant.name,
          enabled: variant.enabled,
          image: variant.image ?? null,
          description: variant.description ?? null,
        })),
      };
    });

    return result;
  }
}
