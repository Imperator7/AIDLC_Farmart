/** GET /api/hello: a hello-world JSON endpoint. */
export async function GET() {
  return Response.json({ message: "Hello, world!" });
}
