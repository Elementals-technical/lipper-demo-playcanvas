export const THREEKIT_PUBLIC_TOKEN = () =>
  process.env.TRBL_THREEKIT_ENV === "admin-fts"
    ? process.env.THREEKIT_ADMIN_FTS_PUBLIC_TOKEN
    : process.env.THREEKIT_PREVIEW_PUBLIC_TOKEN;

export const THREEKIT_PRIVATE_TOKEN = () =>
  process.env.TRBL_THREEKIT_ENV === "admin-fts"
    ? process.env.THREEKIT_ADMIN_FTS_PRIVATE_TOKEN
    : process.env.THREEKIT_PREVIEW_PRIVATE_TOKEN;

export const THREEKIT_ORG_ID = () =>
  process.env.TRBL_THREEKIT_ENV === "admin-fts"
    ? process.env.THREEKIT_ADMIN_FTS_ORG_ID
    : process.env.THREEKIT_PREVIEW_ORG_ID;

export const THREEKIT_URL = () => `https://${process.env.TRBL_THREEKIT_ENV}.threekit.com`;

export const THREEKIT_PARAMS = {
  THREEKIT_ENV: process.env.TRBL_THREEKIT_ENV,
  ORG_ID: THREEKIT_ORG_ID(),
  TOKEN: THREEKIT_PUBLIC_TOKEN(),
};
