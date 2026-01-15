import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const { pathname, origin } = request.nextUrl;
  
  // Get the hostname without port
  const hostname = request.headers.get('host')?.split(':')[0] || '';
  
  // Handle www to non-www redirect (prevent redirect loops)
  if (hostname.startsWith('www.')) {
    const nonWwwHostname = hostname.replace('www.', '');
    const redirectUrl = new URL(pathname, `https://${nonWwwHostname}`);
    redirectUrl.search = request.nextUrl.search;
    
    // Only redirect if not already redirected (prevent loops)
    if (!request.headers.get('x-redirected')) {
      const response = NextResponse.redirect(redirectUrl, 301);
      response.headers.set('x-redirected', 'true');
      return response;
    }
  }

  // Ensure cookies are set with correct domain
  const response = NextResponse.next();
  
  // Set security headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (they handle their own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/).*)',
  ],
};
