import { cookies } from "next/headers";
import { verifyToken } from "./auth";

export const COOKIE = "auth_token";

export async function getSession(): Promise<{ userId: number; email: string } | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
