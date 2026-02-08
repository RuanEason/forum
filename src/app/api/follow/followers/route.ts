import { GET as getConnections } from "../connections/route";

export async function GET(request: Request) {
  const url = new URL(request.url);
  url.searchParams.set("type", "followers");

  const forwardedRequest = new Request(url.toString(), {
    method: "GET",
    headers: request.headers,
  });
  return getConnections(forwardedRequest);
}
