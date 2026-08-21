import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeInternalPath } from "@/lib/safe-path";

const protectedPrefixes = [
  "/dashboard",
  "/projects",
  "/invoices",
  "/clients",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isLogin = pathname === "/login";

  const forwardedProto = req.headers.get("x-forwarded-proto");
  const secure =
    forwardedProto === "https" || req.nextUrl.protocol === "https:";
  const cookieName = secure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET,
    cookieName,
  });

  if (isProtected && !token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", safeInternalPath(pathname));
    return NextResponse.redirect(url);
  }

  if (isLogin && token) {
    const url = req.nextUrl.clone();
    const next = safeInternalPath(req.nextUrl.searchParams.get("next"));
    url.pathname = next;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/invoices/:path*",
    "/clients/:path*",
    "/login",
  ],
};
