import { api, notFound } from "@/server/http";

/** Any /api path without a handler answers with a NOT_FOUND problem instead of the HTML 404 page. */
const missing = api((request) => {
  throw notFound(`No endpoint ${request.method} ${new URL(request.url).pathname}. See /docs for the API.`);
});

export { missing as GET, missing as POST, missing as PUT, missing as PATCH, missing as DELETE };
