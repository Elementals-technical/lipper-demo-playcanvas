/** Product metadata from PRODUCTS (datatable 576). */
export interface ProductDefinition {
  variantId: string;
  productVariantName: string;
  label: string;
  tableContentId: string;
}

/** Content for one part in the table selected by PRODUCTS.tableContentId. */
export interface DatatablePart {
  id: string;
  partNumber: string;
  groupName: string;
  displayName: string;
  category: string;
  side: string;
  description: string;
  technicalNotes: string;
  storeLink: string | null;
  storeLinkText: string | null;
  specifications: Record<string, string>;
  maintenance: { interval: string; task: string; commonIssues: string } | null;
  relatedProducts: string[];
  parentAssemblies: string[];
  components: string[];
}

type DatatableRow = Record<string, string | number | null | undefined>;
interface DatatableResponse {
  rows?: DatatableRow[];
}

const DATATABLE_BASE_URL = "https://renderadmin.vivid3d.tech/datatables";
const PRODUCTS_TABLE_ID = "576";
const SPEC_FIELDS: Record<string, string> = {
  spec_material: "Material",
  spec_weight: "Weight",
  spec_torque: "Torque",
  spec_bearing_type: "Bearing Type",
  spec_brake_type: "Brake Type",
  spec_spring_type: "Spring Type",
  spec_load_capacity: "Load Capacity",
  spec_lining_life: "Lining Life",
  spec_durability: "Durability",
};

let productsPromise: Promise<Map<string, ProductDefinition>> | null = null;
const contentPromises = new Map<string, Promise<DatatablePart[]>>();

/** Preserves text values while accepting numeric identifiers returned by Vivid. */
const text = (value: DatatableRow[string]): string => String(value ?? "");

/** Parses comma-separated part references. */
const references = (value: DatatableRow[string]): string[] =>
  text(value)
    .split(",")
    .map((partNumber) => partNumber.trim())
    .filter(Boolean);

/** Fetches a Vivid datatable; rejects unsuccessful HTTP responses. */
async function fetchTable(tableId: string): Promise<DatatableResponse> {
  const response = await fetch(`${DATATABLE_BASE_URL}/${tableId}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/** Shares PRODUCTS between labels and content routing; failed requests can be retried. */
export function fetchProducts(): Promise<Map<string, ProductDefinition>> {
  if (!productsPromise) {
    productsPromise = fetchTable(PRODUCTS_TABLE_ID)
      .then(
        (data) =>
          new Map(
            (data.rows ?? [])
              .filter((row) => text(row.variantId))
              .map((row) => {
                const variantId = text(row.variantId).trim();
                return [
                  variantId,
                  {
                    variantId,
                    productVariantName: text(row.productVariantName),
                    label: text(row.label),
                    tableContentId: text(row.tableContentId).trim(),
                  },
                ];
              })
          )
      )
      .catch((error) => {
        productsPromise = null;
        throw error;
      });
  }
  return productsPromise;
}

/** Converts the product-content schema to UI fields, including specs, maintenance and related parts. */
function parseParts(data: DatatableResponse): DatatablePart[] {
  return (data.rows ?? [])
    .filter((row) => text(row.partNumber).trim())
    .map((row) => {
      const interval = text(row.maint_interval);
      const task = text(row.maint_task);
      const commonIssues = text(row.maint_common_issues);
      return {
        id: text(row.id),
        partNumber: text(row.partNumber).trim(),
        groupName: text(row.groupName),
        displayName: text(row.displayName),
        category: text(row.category),
        side: text(row.side),
        description: text(row.description),
        technicalNotes: text(row.technical_notes),
        storeLink: text(row.store_link) || null,
        storeLinkText: text(row.store_link_text) || null,
        specifications: Object.fromEntries(
          Object.entries(SPEC_FIELDS)
            .filter(([key]) => text(row[key]))
            .map(([key, label]) => [label, text(row[key])])
        ),
        maintenance: interval || task || commonIssues ? { interval, task, commonIssues } : null,
        relatedProducts: references(row.relatedProducts),
        parentAssemblies: references(row.parentAssemblies),
        components: references(row.components),
      };
    });
}

/**
 * Loads PRODUCTS first, then the current product's content table.
 * Missing mappings and the unpublished 1111 placeholder return no parts.
 * Requests are shared by table ID; failed requests are evicted for retry.
 */
export async function fetchProductParts(productId: string | number): Promise<DatatablePart[]> {
  const products = await fetchProducts();
  const tableId = products.get(String(productId))?.tableContentId;
  if (!tableId || tableId === "1111" || !/^[1-9]\d*$/.test(tableId)) return [];

  let promise = contentPromises.get(tableId);
  if (!promise) {
    promise = fetchTable(tableId)
      .then(parseParts)
      .catch((error) => {
        contentPromises.delete(tableId);
        throw error;
      });
    contentPromises.set(tableId, promise);
  }
  return promise;
}
