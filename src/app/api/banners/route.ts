import { listBanners } from "@/server/catalog";
import { api, parseQuery } from "@/server/http";
import { bannerQuery } from "@/server/validation";

/** GET /api/banners */
export const GET = api((request) => Response.json({ data: listBanners(parseQuery(request, bannerQuery).placement) }));
