/**
 * Route-handler plumbing for openapi.yaml's conventions: an `X-Request-Id` on every response,
 * and every error as an RFC 9457 problem document (`Problem`) with a stable `code`.
 */
import type { z } from "zod";
import { queryObject } from "./validation";

export type FieldError = { field: string; code: string; message: string };

export type Problem = {
  type: string;
  title: string;
  status: number;
  code: string;
  detail?: string;
  instance?: string;
  requestId: string;
  errors?: FieldError[];
};

/** Throw from a handler to answer with a problem document. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly title: string,
    readonly detail?: string,
    readonly errors?: FieldError[],
  ) {
    super(detail ?? title);
  }
}

const problemType = (code: string) => `https://farmart.dev/problems/${code.toLowerCase().replace(/_/g, "-")}`;

export function problemResponse(error: ApiError, requestId: string, instance?: string) {
  const body: Problem = {
    type: problemType(error.code),
    title: error.title,
    status: error.status,
    code: error.code,
    detail: error.detail,
    instance,
    requestId,
    errors: error.errors,
  };
  return new Response(JSON.stringify(body), { status: error.status, headers: { "Content-Type": "application/problem+json" } });
}

export const notFound = (detail: string) => new ApiError(404, "NOT_FOUND", "Not found", detail);

/** Validates the query string; failures become 422 `VALIDATION_FAILED` with one entry per field. */
export function parseQuery<T extends z.ZodType>(request: Request, schema: T): z.infer<T> {
  const result = schema.safeParse(queryObject(new URL(request.url).searchParams));
  if (result.success) return result.data;
  throw new ApiError(
    422,
    "VALIDATION_FAILED",
    "Some fields are invalid",
    "Fix the highlighted query parameters and try again.",
    result.error.issues.map((issue) => {
      const field = issue.path.join(".") || "query";
      return issue.code === "invalid_type" && issue.message.endsWith("received undefined")
        ? { field, code: "REQUIRED", message: `${field} is required.` }
        : { field, code: issue.code.toUpperCase(), message: issue.message };
    }),
  );
}

type Handler<C> = (request: Request, context: C) => Response | Promise<Response>;

/** Wraps a route handler: adds `X-Request-Id`, turns ApiError into a problem and anything else into a 500. */
export function api<C>(handler: Handler<C>): (request: Request, context: C) => Promise<Response> {
  return async (request, context) => {
    const requestId = `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const instance = new URL(request.url).pathname;
    let response: Response;
    try {
      response = await handler(request, context);
    } catch (e) {
      if (e instanceof ApiError) response = problemResponse(e, requestId, instance);
      else {
        console.error(`[${requestId}] ${request.method} ${instance}`, e);
        response = problemResponse(
          new ApiError(500, "INTERNAL_ERROR", "Internal Server Error", "Something went wrong on our side. Try again in a moment."),
          requestId,
          instance,
        );
      }
    }
    response.headers.set("X-Request-Id", requestId);
    return response;
  };
}
