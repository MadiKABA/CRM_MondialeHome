import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/magic-link",
];

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = getSessionCookie(request);
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthPath = AUTH_PATHS.some((p) => pathname === p);

  // Redirect authenticated users away from auth pages
  if (session && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Protect dashboard routes
  if (!session && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
