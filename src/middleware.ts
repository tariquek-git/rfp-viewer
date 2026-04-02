import { NextRequest, NextResponse } from 'next/server';

// Rate limiting: simple in-memory counter per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests per window
const RATE_WINDOW = 60_000; // 1 minute

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

// Clean up stale entries on each rate-limit check (no setInterval in serverless)
function cleanupRateLimitMap() {
  if (rateLimitMap.size > 1000) {
    const now = Date.now();
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
  }
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: login page, auth endpoint, Next.js internals, favicon
  if (
    pathname === '/login' ||
    pathname === '/api/auth' ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('rfp-auth');
  const authenticated = authCookie?.value === 'authenticated';

  // API routes: return 401 JSON (not redirect) if unauthenticated
  if (pathname.startsWith('/api/')) {
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // Rate limit authenticated API calls (lazy cleanup to avoid memory leak)
    cleanupRateLimitMap();
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (rateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // Protect rfp_data.json (static file with confidential data)
  if (pathname === '/rfp_data.json') {
    if (!authenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // All other pages: redirect to login if not authenticated
  if (!authenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://api.anthropic.com https://*.supabase.co",
    "frame-ancestors 'none'",
  ].join('; ');
  response.headers.set('Content-Security-Policy', csp);
}

export const config = {
  matcher: [
    // Only run middleware on pages and API routes — skip all static assets
    // to minimise serverless function invocations (Vercel cost optimisation)
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|woff2?|ttf|css|js|map)$).*)',
  ],
};
