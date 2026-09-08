import { Request, Response, NextFunction } from 'express';
import { verifyJWT, AuthSession, validateTenantMembership } from './supabase-client';

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      auth?: AuthSession;
      tenantId?: string;
    }
  }
}

// Auth middleware
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Check for session cookie (web)
      const sessionCookie = req.cookies?.['sb-auth-token'];
      if (!sessionCookie) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
      }

      const session = await verifyJWT(sessionCookie);
      if (!session) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }

      req.auth = session;
      req.tenantId = session.tenantId;
      return next();
    }

    const token = authHeader.substring(7);
    const session = await verifyJWT(token);

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Check token expiration
    if (session.exp * 1000 < Date.now()) {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }

    req.auth = session;
    req.tenantId = session.tenantId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Tenant validation middleware
export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tenantIdParam = (req.params.tenantId || req.query.tenant_id) as string;
    if (!tenantIdParam) {
      return res.status(400).json({ error: 'Missing tenant ID' });
    }

    // Validate tenant membership
    const isMember = await validateTenantMembership(req.auth.userId, tenantIdParam);
    if (!isMember) {
      return res.status(403).json({ error: 'Forbidden: Not a member of this tenant' });
    }

    req.tenantId = tenantIdParam;
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Role-based access control middleware
export function requireRole(...roles: AuthSession['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ error: `Forbidden: Required role ${roles.join(', ')}` });
    }

    next();
  };
}

// CSRF protection middleware
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  const method = req.method;

  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string;
  const sessionCsrfToken = req.cookies?.['x-csrf-token'];

  if (!csrfToken || csrfToken !== sessionCsrfToken) {
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }

  next();
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");

  next();
}
