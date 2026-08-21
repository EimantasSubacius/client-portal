import { signIn } from "@/lib/auth";
import { jsonData, jsonError } from "@/lib/api";
import { loginRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations";
import { AuthError } from "next-auth";

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

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

  const ip = clientIp(req);
  const limit = loginRateLimit(ip, parsed.data.email);
  if (!limit.allowed) {
    return jsonError(
      "rate_limited",
      "Too many login attempts. Try again later.",
      429,
    );
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
    return jsonData({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      return jsonError("unauthorized", "Invalid email or password.", 401);
    }
    // NextAuth may throw NEXT_REDIRECT even with redirect:false in some versions
    if (e && typeof e === "object" && "digest" in e) {
      return jsonData({ ok: true });
    }
    return jsonError("unauthorized", "Invalid email or password.", 401);
  }
}
