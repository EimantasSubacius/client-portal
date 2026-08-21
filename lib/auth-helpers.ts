import { auth } from "@/lib/auth";
import type { SessionUser } from "@/lib/permissions";
import { jsonError } from "@/lib/api";

export async function requireUser(): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; response: ReturnType<typeof jsonError> }
> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email || !session.user.role) {
    return {
      ok: false,
      response: jsonError("unauthorized", "Sign in required.", 401),
    };
  }
  return {
    ok: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name ?? "",
      role: session.user.role,
    },
  };
}

export async function requireAdmin(): Promise<
  | { ok: true; user: SessionUser }
  | { ok: false; response: ReturnType<typeof jsonError> }
> {
  const result = await requireUser();
  if (!result.ok) return result;
  if (result.user.role !== "ADMIN") {
    return {
      ok: false,
      response: jsonError("forbidden", "Admin only.", 403),
    };
  }
  return result;
}
