import { getStoreSettings } from "@/server/catalog";
import { api, only } from "@/server/http";

/** GET /api/store/settings */
export const GET = api(() => Response.json(getStoreSettings()));
export const { POST, PUT, PATCH, DELETE } = only("GET");
