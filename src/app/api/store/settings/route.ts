import { getStoreSettings } from "@/server/catalog";
import { api } from "@/server/http";

/** GET /api/store/settings */
export const GET = api(() => Response.json(getStoreSettings()));
