import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only log in development environment
  if (process.env.NODE_ENV !== 'production') {
    const method = request.method;
    const pathname = request.nextUrl.pathname;
    const search = request.nextUrl.search;
    const url = pathname + search;

    // Use cyan for GET, green for POST, yellow for PATCH/PUT, red for DELETE
    let methodColor = '\x1b[36m'; // Cyan
    if (method === 'POST') methodColor = '\x1b[32m'; // Green
    if (['PATCH', 'PUT'].includes(method)) methodColor = '\x1b[33m'; // Yellow
    if (method === 'DELETE') methodColor = '\x1b[31m'; // Red

    console.log(`\n\x1b[1m\x1b[33m--> [REQUEST]\x1b[0m \x1b[1m${methodColor}${method}\x1b[0m \x1b[0m${url}\x1b[0m`);

    // Print warning if they are requesting API endpoints without the /api prefix
    const apiKeywords = ['orders', 'products', 'delivery-boys', 'categories', 'vendor-add-products', 'wishlist', 'cart', 'auth'];
    const isMissingApiPrefix = !pathname.startsWith('/api') && apiKeywords.some(keyword => pathname.includes(keyword));
    
    if (isMissingApiPrefix) {
      console.warn(`\x1b[31m⚠️ [WARNING]: Missing '/api' prefix in request path! Did you mean '/api${pathname}${search}'?\x1b[0m`);
    }

    // Try to log the request body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const clonedRequest = request.clone();
          const body = await clonedRequest.json();
          const safeBody = { ...body };
          if (safeBody.password) safeBody.password = '********';
          console.log(`\x1b[34m[REQUEST BODY]:\x1b[0m`, JSON.stringify(safeBody, null, 2));
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          const clonedRequest = request.clone();
          const text = await clonedRequest.text();
          console.log(`\x1b[34m[REQUEST BODY]:\x1b[0m`, text);
        }
      } catch (e) {
        // Suppress errors to avoid breaking requests
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    '/((?!_next/static|_next/image|favicon.ico|images).*)',
  ],
};
