// app/core/middleware/auth.ts
import { UserResponse, UserSession } from "@/app/(auth)/_types/auth.types";
import { SetAuthCookieAction } from "@/app/_actions/auth-actions";
import { decryptSession } from "@/app/utils/session";
import { permissionMatches } from "@/lib/permissions";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const authorizationRules: Array<{
  pathPrefix: string;
  roles?: string[];
  permissions?: string[];
}> = [
  { pathPrefix: "/dashboard/admin", permissions: ["admin.manage"] },
  { pathPrefix: "/dashboard/payment-request", permissions: ["payment.create", "payment.approve"] },
  { pathPrefix: "/dashboard/petty-cash", permissions: ["payment.create", "payment.approve"] },
  { pathPrefix: "/dashboard/workflow/inbox", permissions: ["workflow.inbox.read"] },
  { pathPrefix: "/dashboard/workflow/tracking", permissions: ["workflow.tracking.read", "workflow.all.read", "workflow.read"] },
  { pathPrefix: "/dashboard/procurement", permissions: ["procurement.read"] },
  { pathPrefix: "/dashboard/inventory", permissions: ["inventory.read", "inventory.transfer"] },
  { pathPrefix: "/dashboard/master", permissions: ["masterdata.manage", "item.read", "item.*"] },
];

const PUBLIC_AUTH_PATHS = ["/login", "/signin", "/register"];

function isBypassPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/session")) return true;
  if (pathname === "/favicon.ico") return true;
  if (/\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2?)$/i.test(pathname)) return true;
  return false;
}

function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.includes(pathname);
}

function redirectToDashboard(request: NextRequest): NextResponse {
  const u = request.nextUrl.clone();
  u.pathname = "/dashboard";
  u.search = "";
  return NextResponse.redirect(u);
}

const hasAuthorization = (session: UserSession, pathname: string) => {
  const matchedRule = authorizationRules.find((rule) => pathname.startsWith(rule.pathPrefix));

  if (!matchedRule) {
    return true;
  }

  const sessionRoles = session.roles ?? [];
  const sessionPermissions = session.permissions ?? [];

  const roleAllowed =
    !matchedRule.roles ||
    matchedRule.roles.length === 0 ||
    matchedRule.roles.some((role) => sessionRoles.includes(role));

  const permissionAllowed =
    !matchedRule.permissions ||
    matchedRule.permissions.length === 0 ||
    matchedRule.permissions.some((permission) =>
      permissionMatches(sessionPermissions, permission)
    );

  return roleAllowed && permissionAllowed;
};

export async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  if (isBypassPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get("erp-session")?.value;

  const authRoutes = PUBLIC_AUTH_PATHS;
  const protectedRoutes = ["/dashboard"];

  const signinRoute = nextUrl.clone();

  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  // بدون سشن: فقط صفحات لاگین/ثبت‌نام عمومی؛ بقیه → لاگین
  if (!session) {
    if (isProtectedRoute) {
      const callbackUrl = encodeURIComponent(pathname + nextUrl.search);
      signinRoute.pathname = "/login";
      signinRoute.search = `?callbackUrl=${callbackUrl}`;
      return NextResponse.redirect(signinRoute);
    }
    if (isPublicAuthPath(pathname)) {
      return NextResponse.next();
    }
    signinRoute.pathname = "/login";
    signinRoute.search = "";
    return NextResponse.redirect(signinRoute);
  }

  try {
    const parsed = (await decryptSession(session)) as unknown as UserSession;
    const now = Date.now();
    const accessExpired = parsed.exp < now;
    const refreshExpired = parsed.sessionExpiry < now;

    // سشن معتبر و روی صفحهٔ ورود/ثبت‌نام → داشبورد
    if (!accessExpired && !refreshExpired && isAuthRoute) {
      return redirectToDashboard(request);
    }

    if (!accessExpired && !refreshExpired && !hasAuthorization(parsed, pathname)) {
      return redirectToDashboard(request);
    }

    if (refreshExpired) {
      const cookieStore = await cookies();
      cookieStore.delete("erp-session");
      signinRoute.pathname = "/login";
      signinRoute.search = "";
      return NextResponse.redirect(signinRoute);
    }

    if (accessExpired && !refreshExpired) {
      try {
        const response = await fetch("https://general-api.classbon.com/api/identity/refresh-token", {
          method: "POST",
          body: JSON.stringify({ sessionId: parsed.sessionId }),
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const user = (await response.json()) as UserResponse;
          await SetAuthCookieAction(user);

          if (!hasAuthorization(parsed, pathname)) {
            return redirectToDashboard(request);
          }
        } else {
          throw new Error("Refresh failed");
        }
      } catch {
        signinRoute.pathname = "/login";
        signinRoute.search = "";
        return NextResponse.redirect(signinRoute);
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    signinRoute.pathname = "/login";
    signinRoute.search = "";
    return NextResponse.redirect(signinRoute);
  }

  // سشن معتبر: فقط داشبورد؛ ریشه یا هر مسیر دیگر → داشبورد
  if (pathname === "/" || (!pathname.startsWith("/dashboard") && !isPublicAuthPath(pathname))) {
    return redirectToDashboard(request);
  }

  return NextResponse.next();
}
