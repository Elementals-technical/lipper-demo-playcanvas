export default {
  credentials: {
    preview: {
      orgId: process.env.THREEKIT_PREVIEW_ORG_ID,
      publicToken: process.env.THREEKIT_PREVIEW_PUBLIC_TOKEN,
    },
    "admin-fts": {
      orgId: process.env.THREEKIT_ADMIN_FTS_ORG_ID,
      publicToken: process.env.THREEKIT_ADMIN_FTS_PUBLIC_TOKEN,
    },
  },

  products: {
    preview: {
      assetId: "a6a3759d-39b6-46a5-9982-715911a760ba",
      configurationId: undefined,
      stageId: undefined,
    },
    "admin-fts": {
      assetId: undefined,
      configurationId: undefined,
      stageId: undefined,
    },
  },
};
