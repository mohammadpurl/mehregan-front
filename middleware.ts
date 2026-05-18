import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "./app/core/middleware/auth";

export async function middleware(request: NextRequest) {
   
  // مرحله ۱: اجرای Middleware احراز هویت (همان کد قبلی شما)
  const authResponse = await authMiddleware(request);

  // اگر authMiddleware ریدایرکت کرده باشد، همان را برگردان
  if (authResponse.status !== 200) {
    return authResponse;
  }

  // مرحله ۲: اضافه کردن pathname به هدر (برای Navbar سرور-ساید)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-current-path', request.nextUrl.pathname);

  // برگرداندن پاسخ جدید با هدر اضافه شده
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
export const config = {
   matcher: '/:path*' // Apply this middleware to all paths
 };