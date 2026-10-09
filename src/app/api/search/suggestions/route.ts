import { searchSuggestions } from "@/server/catalog";
import { api, only, parseQuery } from "@/server/http";
import { suggestionQuery } from "@/server/validation";

/** GET /api/search/suggestions: header search autocomplete. */
export const GET = api((request) => {
  const { q, limit } = parseQuery(request, suggestionQuery);
  return Response.json(searchSuggestions(q, limit));
});
export const { POST, PUT, PATCH, DELETE } = only("GET");
