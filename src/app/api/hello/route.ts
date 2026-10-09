import { only } from "@/server/http";

/** GET /api/hello: a hello-world JSON endpoint. */
export async function GET() {
  return Response.json({ message: "Hello, world!" });
}
export const { POST, PUT, PATCH, DELETE } = only("GET");
