import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const { nextUrl } = req;
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });
  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;

  const isAuthRoute = ["/login", "/signup", "/register"].includes(nextUrl.pathname);
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isVendorRoute = nextUrl.pathname.startsWith("/vendor");
  const isDeliveryRoute = nextUrl.pathname.startsWith("/delivery");
  const isSupportRoute = nextUrl.pathname.startsWith("/support");
  const isCustomerRoute =
    nextUrl.pathname.startsWith("/checkout") || nextUrl.pathname.startsWith("/account");

  const vendorStatus = token?.vendorStatus as string | undefined;

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (role === "admin") return NextResponse.redirect(new URL("/admin", nextUrl));
      if (role === "vendor") {
        if (vendorStatus !== "approved") return NextResponse.redirect(new URL("/vendor/pending", nextUrl));
        return NextResponse.redirect(new URL("/vendor", nextUrl));
      }
      if (role === "delivery_partner") return NextResponse.redirect(new URL("/delivery", nextUrl));
      if (role === "support") return NextResponse.redirect(new URL("/support", nextUrl));
      return NextResponse.redirect(new URL("/account", nextUrl));
    }
    return NextResponse.next();
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  if (isVendorRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "vendor" && role !== "admin") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    
    // Vendor approval gating
    if (role === "vendor") {
      const isPendingPage = nextUrl.pathname === "/vendor/pending";
      if (vendorStatus !== "approved" && !isPendingPage) {
        return NextResponse.redirect(new URL("/vendor/pending", nextUrl));
      }
      if (vendorStatus === "approved" && isPendingPage) {
        return NextResponse.redirect(new URL("/vendor", nextUrl));
      }
    }
    return NextResponse.next();
  }

  if (isDeliveryRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "delivery_partner" && role !== "admin") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  if (isSupportRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "support" && role !== "admin") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  if (isCustomerRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
    }
    if (role === "vendor") {
      if (vendorStatus !== "approved") return NextResponse.redirect(new URL("/vendor/pending", nextUrl));
      return NextResponse.redirect(new URL("/vendor", nextUrl));
    }
    if (role === "delivery_partner") {
      return NextResponse.redirect(new URL("/delivery", nextUrl));
    }
    if (role === "support") {
      return NextResponse.redirect(new URL("/support", nextUrl));
    }
    return NextResponse.next();
  }

  // Redirect root to dashboard based on role if needed? No, public users can see root.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*", 
    "/vendor/:path*", 
    "/delivery/:path*", 
    "/support/:path*", 
    "/checkout/:path*", 
    "/account/:path*", 
    "/login", 
    "/signup"
  ],
};
