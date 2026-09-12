// ============================================================
// Surge.AI — Auth Helper (Backend)
// ============================================================
// Extracts authenticated user from incoming request.
// Supports both cookie-based and Bearer token auth.
// ============================================================

import { supabaseAdmin } from './supabaseClient';
import type { NextApiRequest } from 'next';

export interface AuthUser {
  id: string;
  email: string;
  tenant_id: string;
  display_name: string;
}

// ============================================================
// Extract user from request (supports multiple auth methods)
// ============================================================

export async function getUserFromRequest(req: NextApiRequest): Promise<AuthUser | null> {
  try {
    // Method 1: Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return await verifyToken(token);
    }

    // Method 2: Cookie-based session
    const cookieHeader = req.headers.cookie;
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      const accessToken = cookies['sb-access-token'];
      if (accessToken) {
        return await verifyToken(accessToken);
      }
    }

    return null;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// ============================================================
// Verify JWT token with Supabase
// ============================================================

async function verifyToken(token: string): Promise<AuthUser | null> {
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  // Fetch profile to get tenant_id
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, tenant_id, display_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    tenant_id: profile.tenant_id,
    display_name: profile.display_name || 'User',
  };
}

// ============================================================
// Cookie parser utility
// ============================================================

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {} as Record<string, string>);
}

// ============================================================
// Middleware wrapper for protected routes
// ============================================================

export function withAuth(
  handler: (req: NextApiRequest, res: any, user: AuthUser) => Promise<void>
) {
  return async (req: NextApiRequest, res: any) => {
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    return handler(req, res, user);
  };
}
