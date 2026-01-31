import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

// List of protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile-edit',
  '/job-details',
  '/jobs',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // If it's a protected route, check authentication
  if (isProtectedRoute) {
    // Get the token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token exists, redirect to signin with callback URL
    if (!token) {
      const signinUrl = new URL('/auth/signin', request.url);
      signinUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signinUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
