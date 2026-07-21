// app/core/middleware/auth.ts
import { UserResponse, UserSession } from "@/app/(auth)/_types/auth.types";
import { SetAuthCookieAction } from "@/app/_actions/auth-actions";
import {
  ERP_ACCESS_TOKEN_COOKIE,
  ERP_SESSION_COOKIE,
} from "@/app/utils/auth-cookie";
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
  {
    pathPrefix: "/dashboard/payment-request/procurement",
    permissions: ["payment.create", "payment.approve", "procurement.read"],
  },
  { pathPrefix: "/dashboard/payment-request", permissions: ["payment.create", "payment.approve"] },
  { pathPrefix: "/dashboard/petty-cash", permissions: ["payment.create", "payment.approve"] },
  {
    pathPrefix: "/dashboard/workflow/inbox",
    permissions: ["workflow.inbox.read", "dashboard.read"],
  },
  { pathPrefix: "/dashboard/workflow/tracking", permissions: ["workflow.tracking.read", "workflow.all.read", "workflow.read"] },
  { pathPrefix: "/dashboard/procurement", permissions: ["procurement.read"] },
  { pathPrefix: "/dashboard/product-request", permissions: ["procurement.read", "procurement.write"] },
  { pathPrefix: "/dashboard/inventory", permissions: ["inventory.read", "inventory.transfer"] },
  {
    pathPrefix: "/dashboard/master/suppliers",
    permissions: ["procurement.read", "procurement.write", "masterdata.manage", "item.read", "item.*"],
  },
  { pathPrefix: "/dashboard/master", permissions: ["masterdata.manage", "item.read", "item.*"] },
];

const PUBLIC_AUTH_PATHS = ["/login", "/signin"];

/**
 * فقط این endpointهای API بدون سشن مجازند (نه کل /api).
 * /api/auth/session باید برای کلاینت 401 JSON برگرداند، نه redirect به لاگین.
 */
const PUBLIC_API_EXACT_PATHS = new Set([
  "/api/auth/session",
  "/session",
]);

function isPublicApiPath(pathname: string): boolean {
  return PUBLIC_API_EXACT_PATHS.has(pathname);
}

function isBypassPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (/\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff2?)$/i.test(pathname)) return true;
  return false;
}

function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.includes(pathname);
}

/** Server Action / RSC mutation — نباید با redirect شکسته شود */
function isNextMutationRequest(request: NextRequest): boolean {
  if (request.method !== "POST" && request.method !== "PUT" && request.method !== "PATCH") {
    return false;
  }
  return (
    request.headers.has("next-action") ||
    request.headers.has("Next-Action") ||
    request.headers.get("accept")?.includes("text/x-component") === true
  );
}

function redirectToDashboard(request: NextRequest): NextResponse {
  const u = request.nextUrl.clone();
  u.pathname = "/dashboard";
  u.search = "";
  return NextResponse.redirect(u);
}

function unauthorizedApi(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const isApiOrSessionRoute =
    pathname.startsWith("/api") || pathname === "/session" || pathname.startsWith("/session/");

  // endpointهای عمومی صریح (نه کل /api)
  if (isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(ERP_SESSION_COOKIE)?.value;

  const authRoutes = PUBLIC_AUTH_PATHS;
  const protectedRoutes = ["/dashboard"];

  const signinRoute = nextUrl.clone();

  const isAuthRoute = authRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!session) {
    if (isApiOrSessionRoute) {
      return unauthorizedApi();
    }
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

    if (!accessExpired && !refreshExpired && isAuthRoute) {
      if (isNextMutationRequest(request)) {
        return NextResponse.next();
      }
      return redirectToDashboard(request);
    }

    if (!accessExpired && !refreshExpired && !hasAuthorization(parsed, pathname)) {
      if (isApiOrSessionRoute) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return redirectToDashboard(request);
    }

    if (refreshExpired) {
      const cookieStore = await cookies();
      cookieStore.delete(ERP_SESSION_COOKIE);
      cookieStore.delete(ERP_ACCESS_TOKEN_COOKIE);
      if (isApiOrSessionRoute) {
        return unauthorizedApi();
      }
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
            if (isApiOrSessionRoute) {
              return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            return redirectToDashboard(request);
          }
        } else {
          throw new Error("Refresh failed");
        }
      } catch {
        if (isApiOrSessionRoute) {
          return unauthorizedApi();
        }
        signinRoute.pathname = "/login";
        signinRoute.search = "";
        return NextResponse.redirect(signinRoute);
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    if (isApiOrSessionRoute) {
      return unauthorizedApi();
    }
    signinRoute.pathname = "/login";
    signinRoute.search = "";
    return NextResponse.redirect(signinRoute);
  }

  if (pathname === "/" || (!pathname.startsWith("/dashboard") && !isPublicAuthPath(pathname) && !isApiOrSessionRoute)) {
    return redirectToDashboard(request);
  }

  return NextResponse.next();
}
