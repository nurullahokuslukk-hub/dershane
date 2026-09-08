import { createClient } from '@supabase/supabase-js';
import { jwtVerify } from 'jose';

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
const jwtSecret = process.env.JWT_SECRET || Buffer.from(supabaseAnonKey.split('.')[1] || '', 'base64');

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Service role client for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// JWT verification interface
export interface AuthSession {
  userId: string;
  email: string;
  tenantId: string;
  role: 'student' | 'teacher' | 'counselor' | 'admin';
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Verify JWT token
export async function verifyJWT(token: string): Promise<AuthSession | null> {
  try {
    const secret = new TextEncoder().encode(jwtSecret.toString());
    const verified = await jwtVerify(token, secret);
    
    return {
      userId: (verified.payload.sub as string) || '',
      email: (verified.payload.email as string) || '',
      tenantId: (verified.payload.tenant_id as string) || '',
      role: (verified.payload.role as AuthSession['role']) || 'student',
      iat: (verified.payload.iat as number) || 0,
      exp: (verified.payload.exp as number) || 0,
      iss: (verified.payload.iss as string) || '',
      aud: (verified.payload.aud as string) || '',
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Validate tenant membership
export async function validateTenantMembership(
  userId: string,
  tenantId: string,
  requiredRole?: AuthSession['role']
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_tenants')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) return false;

    if (requiredRole && data.role !== requiredRole) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Tenant membership validation failed:', error);
    return false;
  }
}

// Get user role in tenant
export async function getUserRole(
  userId: string,
  tenantId: string
): Promise<AuthSession['role'] | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_tenants')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) return null;
    return data.role;
  } catch (error) {
    console.error('Get user role failed:', error);
    return null;
  }
}

// Refresh session
export async function refreshAuthSession(refreshToken: string): Promise<AuthSession | null> {
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      return null;
    }

    return verifyJWT(data.session.access_token);
  } catch (error) {
    console.error('Session refresh failed:', error);
    return null;
  }
}

// Create user with Supabase Auth
export async function createAuthUser(
  email: string,
  password: string,
  metadata?: Record<string, unknown>
) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: metadata,
      email_confirm: true,
    });

    if (error) {
      throw new Error(`Auth user creation failed: ${error.message}`);
    }

    return data.user;
  } catch (error) {
    console.error('Create auth user failed:', error);
    throw error;
  }
}

// Reset password
export async function resetPassword(email: string): Promise<boolean> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL}/auth/reset-password`,
    });

    if (error) {
      console.error('Password reset failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Password reset error:', error);
    return false;
  }
}

// Update user password
export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) {
      console.error('Password update failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Password update error:', error);
    return false;
  }
}

// Disable user account
export async function disableUserAccount(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { disabled: true },
    });

    if (error) {
      console.error('User disable failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('User disable error:', error);
    return false;
  }
}

// Delete user account (soft delete)
export async function deleteUserAccount(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error('User deletion failed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('User deletion error:', error);
    return false;
  }
}
