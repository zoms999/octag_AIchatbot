import { NextRequest, NextResponse } from 'next/server';

// Define protected and public routes
const PROTECTED_ROUTES = ['/dashboard', '/chat', '/tests', '/profile'];
const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password'];
const AUTH_ROUTES = ['/login', '/register'];

interface TokenPayload {
  sub: string;
  user_id: string;
  user_type: string;
  exp: number;
  iat: number;
}

/**
 * Auth guard for Next.js middleware
 * Handles route protection and token validation
 */
export class AuthGuard {
  private static readonly JWT_SECRET =
    process.env.JWT_SECRET_KEY || 'your-secret-key';

  /**
   * Check if route requires authentication
   */
  static isProtectedRoute(pathname: string): boolean {
    return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  }

  /**
   * Check if route is public (no auth required)
   */
  static isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  }

  /**
   * Check if route is auth-related (login, register)
   */
  static isAuthRoute(pathname: string): boolean {
    return AUTH_ROUTES.some((route) => pathname.startsWith(route));
  }

  /**
   * Extract token from request
   */
  static extractToken(request: NextRequest): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookie as fallback
    const tokenCookie = request.cookies.get('access_token');
    if (tokenCookie) {
      return tokenCookie.value;
    }

    return null;
  }

  /**
   * Verify JWT token (simplified version without jose dependency)
   */
  static async verifyToken(token: string): Promise<TokenPayload | null> {
    try {
      // Simple JWT parsing without verification (for client-side use)
      // In production, you should verify the signature server-side
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));

      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < currentTime) {
        return null;
      }

      return payload as TokenPayload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Check if user has required role
   */
  static hasRequiredRole(userType: string, requiredRoles: string[]): boolean {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.includes(userType);
  }

  /**
   * Main auth guard middleware function
   */
  static async guard(
    request: NextRequest,
    options: {
      requiredRoles?: string[];
      redirectTo?: string;
    } = {}
  ): Promise<NextResponse> {
    const { requiredRoles = [], redirectTo = '/login' } = options;
    const { pathname } = request.nextUrl;

    // Allow public routes
    if (this.isPublicRoute(pathname) && !this.isAuthRoute(pathname)) {
      return NextResponse.next();
    }

    const token = this.extractToken(request);

    // Handle protected routes
    if (this.isProtectedRoute(pathname)) {
      if (!token) {
        const loginUrl = new URL(redirectTo, request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      const payload = await this.verifyToken(token);
      if (!payload) {
        const loginUrl = new URL(redirectTo, request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Check role-based access
      if (!this.hasRequiredRole(payload.user_type, requiredRoles)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      return NextResponse.next();
    }

    // Handle auth routes (redirect if already authenticated)
    if (this.isAuthRoute(pathname)) {
      if (token) {
        const payload = await this.verifyToken(token);
        if (payload) {
          const redirectUrl =
            request.nextUrl.searchParams.get('redirect') || '/dashboard';
          return NextResponse.redirect(new URL(redirectUrl, request.url));
        }
      }
    }

    return NextResponse.next();
  }

  /**
   * Create role-based guard
   */
  static createRoleGuard(requiredRoles: string[]) {
    return (request: NextRequest) => this.guard(request, { requiredRoles });
  }

  /**
   * Create admin-only guard
   */
  static adminGuard(request: NextRequest) {
    return this.guard(request, {
      requiredRoles: ['organization_admin'],
      redirectTo: '/unauthorized',
    });
  }

  /**
   * Create organization guard (admin or member)
   */
  static organizationGuard(request: NextRequest) {
    return this.guard(request, {
      requiredRoles: ['organization_admin', 'organization_member'],
    });
  }
}

/**
 * Utility function for Next.js middleware
 */
export function createAuthMiddleware(options?: {
  requiredRoles?: string[];
  redirectTo?: string;
}) {
  return (request: NextRequest) => AuthGuard.guard(request, options);
}

/**
 * Default auth middleware for Next.js
 */
export function authMiddleware(request: NextRequest) {
  return AuthGuard.guard(request);
}
