// 路由守卫（Edge runtime）
// 仅做粗粒度 cookie 检查；权威 role 校验在 server 侧 requireUser()/requireAdmin()。
import { NextResponse, type NextRequest } from "next/server";
import { decodeSessionTokenEdge, SESSION_COOKIE } from "@/lib/auth/edge";

const PUBLIC_APP = ["/app/login", "/app/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = decodeSessionTokenEdge(token);

  // /admin 全部需要 admin 角色
  if (pathname.startsWith("/admin")) {
    if (!payload) {
      return NextResponse.redirect(new URL("/app/login", req.url));
    }
    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/app/generate", req.url));
    }
    return NextResponse.next();
  }

  // /app/* （除 login/register）需要登录
  if (pathname.startsWith("/app")) {
    if (PUBLIC_APP.some((p) => pathname === p)) {
      return NextResponse.next();
    }
    if (!payload) {
      return NextResponse.redirect(new URL("/app/login", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"]
};
