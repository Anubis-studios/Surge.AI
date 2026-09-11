// ============================================================
// Surge.AI — Supabase Admin Client (Backend)
// ============================================================
// This file is for backend use ONLY. Never expose in frontend.
// Uses SUPABASE_SERVICE_KEY which bypasses RLS.
// ============================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================
// Typed helpers for common queries
// ============================================================

export async function getBillingByTenant(tenantId: string) {
  const { data, error } = await supabaseAdmin
    .from('billing_accounts')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) throw error;
  return data;
}

export async function getProfileByUserId(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getRecentVideos(tenantId: string, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from('videos')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

export async function getRecentImages(tenantId: string, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from('images')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
