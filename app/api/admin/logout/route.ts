import { deleteSessionCookie } from "../../../admin-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await deleteSessionCookie();
  return Response.json({ ok: true });
}
