import { GET as getFollowStatus } from "../route";

export async function GET(request: Request) {
  return getFollowStatus(request);
}
