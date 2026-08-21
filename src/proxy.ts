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
    // 로그인 상태로 /login, /signup에 다시 들어오면 대시보드(/notes)가 아니라 랜딩페이지로
    // 보낸다 — 로그인 후 첫 화면은 이제 랜딩페이지(로그인 상태 UI)가 기준.
    return NextResponse.redirect(new URL("/", request.url));
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
