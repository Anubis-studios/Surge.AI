-- ============================================================
-- Surge.AI — Supabase Database Migration
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TENANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan_tier text DEFAULT 'free' CHECK (plan_tier IN ('free', 'creator', 'pro', 'enterprise')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. BILLING ACCOUNTS (Dual Currency)
-- ============================================================
CREATE TABLE IF NOT EXISTS billing_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL ON DELETE CASCADE,
  stripe_customer_id text,
  surge_coins integer DEFAULT 0 NOT NULL CHECK (surge_coins >= 0),
  surge_bucks integer DEFAULT 0 NOT NULL CHECK (surge_bucks >= 0),
  login_streak integer DEFAULT 0 NOT NULL CHECK (login_streak >= 0),
  last_login date,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_tenant_unique ON billing_accounts(tenant_id);

-- ============================================================
-- 4. IMAGE JOBS (pending/processing)
-- ============================================================
CREATE TABLE IF NOT EXISTS image_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  profile_id uuid REFERENCES profiles(id) NOT NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  prompt text NOT NULL,
  params jsonb DEFAULT '{}',
  output_url text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. IMAGES (completed)
-- ============================================================
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  owner_profile_id uuid REFERENCES profiles(id) NOT NULL,
  prompt text NOT NULL,
  params jsonb DEFAULT '{}',
  output_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 6. RENDER JOBS (video - pending/processing)
-- ============================================================
CREATE TABLE IF NOT EXISTS render_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  profile_id uuid REFERENCES profiles(id) NOT NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  input_prompt text NOT NULL,
  input_assets jsonb DEFAULT '{}',
  supplier_primary text,
  supplier_fallbacks text[],
  error_message text,
  cost_supplier numeric DEFAULT 0,
  price_tenant numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 7. VIDEOS (completed)
-- ============================================================
CREATE TABLE IF NOT EXISTS videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  owner_profile_id uuid REFERENCES profiles(id) NOT NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  supplier text,
  input_prompt text NOT NULL,
  input_assets jsonb DEFAULT '{}',
  output_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_images_tenant ON images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_images_owner ON images(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_images_created ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_tenant ON videos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_videos_owner ON videos(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_jobs_tenant ON image_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_image_jobs_status ON image_jobs(status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_tenant ON render_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status ON render_jobs(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE render_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can view billing via tenant membership
CREATE POLICY "billing_select_own" ON billing_accounts
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Users can view their own images
CREATE POLICY "images_select_own" ON images
  FOR SELECT USING (owner_profile_id = auth.uid());

-- Users can insert their own images
CREATE POLICY "images_insert_own" ON images
  FOR INSERT WITH CHECK (owner_profile_id = auth.uid());

-- Users can view their own image jobs
CREATE POLICY "image_jobs_select_own" ON image_jobs
  FOR SELECT USING (profile_id = auth.uid());

-- Users can view their own videos
CREATE POLICY "videos_select_own" ON videos
  FOR SELECT USING (owner_profile_id = auth.uid());

-- Users can insert their own videos
CREATE POLICY "videos_insert_own" ON videos
  FOR INSERT WITH CHECK (owner_profile_id = auth.uid());

-- Users can view their own render jobs
CREATE POLICY "render_jobs_select_own" ON render_jobs
  FOR SELECT USING (profile_id = auth.uid());

-- ============================================================
-- RPC FUNCTIONS (Atomic currency operations)
-- ============================================================

-- Atomic coin addition
CREATE OR REPLACE FUNCTION add_surge_coins(p_tenant_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE billing_accounts
  SET surge_coins = surge_coins + p_amount
  WHERE tenant_id = p_tenant_id;
END;
$$;

-- Atomic buck addition
CREATE OR REPLACE FUNCTION add_surge_bucks(p_tenant_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE billing_accounts
  SET surge_bucks = surge_bucks + p_amount
  WHERE tenant_id = p_tenant_id;
END;
$$;

-- Atomic coin deduction (returns false if insufficient)
CREATE OR REPLACE FUNCTION deduct_surge_coins(p_tenant_id uuid, p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current integer;
BEGIN
  SELECT surge_coins INTO v_current FROM billing_accounts WHERE tenant_id = p_tenant_id FOR UPDATE;
  IF v_current < p_amount THEN
    RETURN false;
  END IF;
  UPDATE billing_accounts SET surge_coins = surge_coins - p_amount WHERE tenant_id = p_tenant_id;
  RETURN true;
END;
$$;

-- Atomic buck deduction (returns false if insufficient)
CREATE OR REPLACE FUNCTION deduct_surge_bucks(p_tenant_id uuid, p_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current integer;
BEGIN
  SELECT surge_bucks INTO v_current FROM billing_accounts WHERE tenant_id = p_tenant_id FOR UPDATE;
  IF v_current < p_amount THEN
    RETURN false;
  END IF;
  UPDATE billing_accounts SET surge_bucks = surge_bucks - p_amount WHERE tenant_id = p_tenant_id;
  RETURN true;
END;
$$;

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('images', 'images', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "images_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');
