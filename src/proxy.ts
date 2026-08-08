import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedPrefixes = [
  "/notes",
  "/exams",
  "/review",
  "/calendar",
  "/timer",
  "/scholarships",
  "/activities",
  "/tutor",
  "/translate",
  "/billing",
  "/inquiries",
  "/admin",
  "/profile",
];
const authPages = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAuthPage = authPages.includes(pathname);

  if (!isProtected && !isAuthPage) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/notes", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/notes/:path*",
    "/exams/:path*",
    "/review/:path*",
    "/calendar/:path*",
    "/timer/:path*",
    "/scholarships/:path*",
    "/activities/:path*",
    "/tutor/:path*",
    "/translate/:path*",
    "/billing/:path*",
    "/inquiries/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/login",
    "/signup",
  ],
};
