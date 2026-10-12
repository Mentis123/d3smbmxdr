import { dispatch } from "../../../../lib/decision-room/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle(request: Request, context: { params: { path?: string[] } }) {
  const url = new URL(request.url);
  const body = request.method === "GET" ? undefined : await request.json().catch(() => ({}));
  const headers: Record<string, string> = {};
  request.headers.forEach((value, name) => { headers[name.toLowerCase()] = value; });
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, name) => { query[name] = value; });
  const res = await dispatch(request.method, context.params.path ?? [], { headers, query, body });
  return new Response(res.payload, { status: res.statusCode, headers: { "cache-control": "no-store", ...res.headers } });
}

export { handle as GET, handle as POST, handle as PUT };
