import { supabaseAdmin } from './supabase-client';
import type { PostgrestError } from '@supabase/supabase-js';

// Repository interface for type safety
export interface IRepository {
  query(sql: string, params?: unknown[]): Promise<unknown[]>;
  insert(table: string, data: Record<string, unknown>): Promise<unknown>;
  update(table: string, data: Record<string, unknown>, filters: Record<string, unknown>): Promise<unknown>;
  delete(table: string, filters: Record<string, unknown>): Promise<boolean>;
  transaction<T>(fn: (repo: IRepository) => Promise<T>): Promise<T>;
}

// PostgreSQL Repository
export class PostgresRepository implements IRepository {
  constructor(private tenantId?: string, private userId?: string) {}

  async query(sql: string, params?: unknown[]): Promise<unknown[]> {
    try {
      const { data, error } = await supabaseAdmin.rpc('execute_sql', {
        sql,
        params: params || [],
      });

      if (error) throw new Error(`Query failed: ${error.message}`);
      return data as unknown[];
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async insert(table: string, data: Record<string, unknown>): Promise<unknown> {
    try {
      // Add tenant and user context
      const record = {
        ...data,
        ...(this.tenantId && { tenant_id: this.tenantId }),
        ...(this.userId && { created_by: this.userId }),
        created_at: new Date().toISOString(),
      };

      const { data: result, error } = await supabaseAdmin
        .from(table)
        .insert([record])
        .select();

      if (error) throw new Error(`Insert failed: ${error.message}`);
      return result?.[0];
    } catch (error) {
      console.error('Insert error:', error);
      throw error;
    }
  }

  async update(
    table: string,
    data: Record<string, unknown>,
    filters: Record<string, unknown>
  ): Promise<unknown> {
    try {
      const record = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      let query = supabaseAdmin.from(table).update(record);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Apply tenant filter for isolation
      if (this.tenantId) {
        query = query.eq('tenant_id', this.tenantId);
      }

      const { data: result, error } = await query.select();

      if (error) throw new Error(`Update failed: ${error.message}`);
      return result?.[0];
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  }

  async delete(table: string, filters: Record<string, unknown>): Promise<boolean> {
    try {
      let query = supabaseAdmin.from(table);

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Apply tenant filter for isolation
      if (this.tenantId) {
        query = query.eq('tenant_id', this.tenantId);
      }

      const { error } = await query.delete();

      if (error) throw new Error(`Delete failed: ${error.message}`);
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  }

  async transaction<T>(fn: (repo: IRepository) => Promise<T>): Promise<T> {
    try {
      // Supabase doesn't directly support transactions on client side
      // Use RPC function for transactional operations
      return await fn(this);
    } catch (error) {
      console.error('Transaction error:', error);
      throw error;
    }
  }
}

// Idempotency helper
export interface IdempotencyKey {
  clientId: string;
  bodyHash: string;
}

export async function checkIdempotency(
  table: string,
  clientId: string,
  bodyHash: string,
  tenantId: string
): Promise<unknown | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from(`${table}_idempotency`)
      .select('result')
      .eq('client_id', clientId)
      .eq('body_hash', bodyHash)
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data?.result || null;
  } catch (error) {
    console.error('Idempotency check error:', error);
    return null;
  }
}

export async function storeIdempotencyResult(
  table: string,
  clientId: string,
  bodyHash: string,
  tenantId: string,
  result: unknown
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from(`${table}_idempotency`)
      .insert([
        {
          client_id: clientId,
          body_hash: bodyHash,
          tenant_id: tenantId,
          result,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Store idempotency result error:', error);
    return false;
  }
}
