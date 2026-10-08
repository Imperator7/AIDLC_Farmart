import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { api, ApiError, notFound, parseQuery, problemResponse } from "../../http";

const request = (url: string, init?: RequestInit) => new Request(`http://localhost${url}`, init);

describe("problemResponse", () => {
  it("writes an RFC 9457 problem with a stable code", async () => {
    const res = problemResponse(new ApiError(409, "OUT_OF_STOCK", "Not enough stock", "Only 2 left.", [{ field: "qty", code: "OUT_OF_STOCK", message: "Only 2 left." }]), "req_1", "/api/cart/items");
    expect(res.status).toBe(409);
    expect(res.headers.get("Content-Type")).toBe("application/problem+json");
    expect(await res.json()).toEqual({
      type: "https://farmart.dev/problems/out-of-stock",
      title: "Not enough stock",
      status: 409,
      code: "OUT_OF_STOCK",
      detail: "Only 2 left.",
      instance: "/api/cart/items",
      requestId: "req_1",
      errors: [{ field: "qty", code: "OUT_OF_STOCK", message: "Only 2 left." }],
    });
  });

  it("leaves out optional fields that are not set", async () => {
    const body = await problemResponse(new ApiError(400, "BAD_REQUEST", "Malformed request"), "req_2").json();
    expect(Object.keys(body).sort()).toEqual(["code", "requestId", "status", "title", "type"]);
  });
});

describe("notFound", () => {
  it("is a 404 NOT_FOUND ApiError", () => {
    const e = notFound("No such thing");
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status: 404, code: "NOT_FOUND", detail: "No such thing", message: "No such thing" });
  });
});

describe("parseQuery", () => {
  const schema = z.object({ q: z.string().min(1), limit: z.coerce.number().int().max(5).default(5) });

  it("returns parsed values", () => {
    expect(parseQuery(request("/x?q=a&limit=3"), schema)).toEqual({ q: "a", limit: 3 });
  });

  it("throws VALIDATION_FAILED with one entry per field", () => {
    try {
      parseQuery(request("/x?limit=9"), schema);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const err = e as ApiError;
      expect(err).toMatchObject({ status: 422, code: "VALIDATION_FAILED" });
      expect(err.errors).toEqual([
        { field: "q", code: "REQUIRED", message: "q is required." },
        { field: "limit", code: "TOO_BIG", message: expect.any(String) },
      ]);
    }
  });

  it("names the whole query when an issue has no path", () => {
    const refined = z.object({}).refine(() => false, { message: "Nope." });
    try {
      parseQuery(request("/x"), refined);
      expect.unreachable();
    } catch (e) {
      expect((e as ApiError).errors).toEqual([{ field: "query", code: "CUSTOM", message: "Nope." }]);
    }
  });
});

describe("api() wrapper", () => {
  afterEach(() => vi.restoreAllMocks());

  it("passes the handler's response through and adds X-Request-Id", async () => {
    const res = await api(() => Response.json({ ok: true }, { status: 201 }))(request("/api/x"), undefined);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true });
    expect(res.headers.get("X-Request-Id")).toMatch(/^req_[0-9a-f]{16}$/);
  });

  it("gives every request a different id", async () => {
    const handler = api(() => new Response(null, { status: 204 }));
    const [a, b] = await Promise.all([handler(request("/a"), undefined), handler(request("/b"), undefined)]);
    expect(a.headers.get("X-Request-Id")).not.toBe(b.headers.get("X-Request-Id"));
  });

  it("supports async handlers and passes the context", async () => {
    const res = await api(async (_req, ctx: { id: string }) => Response.json({ id: ctx.id }))(request("/x"), { id: "7" });
    expect(await res.json()).toEqual({ id: "7" });
  });

  it("turns a thrown ApiError into a problem that repeats the request id", async () => {
    const res = await api(() => {
      throw notFound("Gone.");
    })(request("/api/thing?x=1"), undefined);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toMatchObject({ code: "NOT_FOUND", detail: "Gone.", instance: "/api/thing", requestId: res.headers.get("X-Request-Id") });
  });

  it("hides unexpected errors behind a 500 INTERNAL_ERROR and logs them", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await api(() => {
      throw new Error("database is locked");
    })(request("/api/boom", { method: "POST" }), undefined);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toMatchObject({ code: "INTERNAL_ERROR", status: 500 });
    expect(JSON.stringify(body)).not.toContain("database is locked");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("POST /api/boom"), expect.any(Error));
  });
});
