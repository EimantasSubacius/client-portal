import { RateLimitedSignIn, signIn } from "@/lib/auth";
import { jsonData, jsonError } from "@/lib/api";
import { loginSchema } from "@/lib/validations";
import { AuthError, CredentialsSignin } from "next-auth";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("validation", "Invalid JSON.", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("validation", "Invalid email or password.", 400);
  }

  // Rate limit is enforced inside Credentials authorize (covers /api/auth too).
  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return jsonData({ ok: true });
  } catch (e) {
    if (
      e instanceof RateLimitedSignIn ||
      (e instanceof CredentialsSignin && e.code === "rate_limited") ||
      (e instanceof AuthError &&
        (e as { code?: string }).code === "rate_limited")
    ) {
      return jsonError(
        "rate_limited",
        "Too many login attempts. Try again later.",
        429,
      );
    }
    if (e instanceof AuthError) {
      return jsonError("unauthorized", "Invalid email or password.", 401);
    }
    if (e && typeof e === "object" && "digest" in e) {
      return jsonData({ ok: true });
    }
    return jsonError("unauthorized", "Invalid email or password.", 401);
  }
}
