import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { decryptSession } from "@/lib/auth/session";

const protectedRoutes = ["/dashboard", "/profile"];

export async function proxy(request: NextRequest) {
  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      request.nextUrl.pathname === route ||
      request.nextUrl.pathname.startsWith(`${route}/`),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const session = await decryptSession(
    request.cookies.get("hiking_alerts_session")?.value,
  );

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
