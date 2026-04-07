// Окремий тип для джерела (ключів усередині продукту)
export type ProductSource = "preview" | "admin-fts";

// Окремий тип для об’єкта з assetId
interface ProductAsset {
  assetId: string;
}

// Тип для кожного продукту
interface ProductEntry {
  preview: ProductAsset;
  "admin-fts": ProductAsset;
}

// Тип для всього productsLippert
type ProductsLippert = Record<string, ProductEntry>;

export const productsLippert: ProductsLippert = {
  Trailer_Axle: {
    preview: {
      assetId: "2e973f25-8ebe-46bd-ab37-61f676ddc196",
    },
    "admin-fts": {
      assetId: "2e973f25-8ebe-46bd-ab37-61f676ddc196",
    },
  },
  Baggage_Door: {
    preview: {
      assetId: "a6a3759d-39b6-46a5-9982-715911a760ba",
    },
    "admin-fts": {
      assetId: "a6a3759d-39b6-46a5-9982-715911a760ba",
    },
  },
  Right_Hinge_RV: {
    preview: {
      assetId: "d1dda933-d976-410a-a671-c0f1289aae96",
    },
    "admin-fts": {
      assetId: "d1dda933-d976-410a-a671-c0f1289aae96",
    },
  },
  Sprinter_Cargo_Van: {
    preview: {
      assetId: "12f1762e-7ade-4336-b02e-131651d66c13",
    },
    "admin-fts": {
      assetId: "12f1762e-7ade-4336-b02e-131651d66c13",
    },
  },
};
