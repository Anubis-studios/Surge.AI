// ============================================================
// Surge.AI — Type Definitions (mirrors Supabase schema)
// ============================================================

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan_tier: 'free' | 'creator' | 'pro' | 'enterprise';
  created_at: string;
}

export interface BillingAccount {
  id: string;
  tenant_id: string;
  stripe_customer_id: string | null;
  surge_coins: number;
  surge_bucks: number;
  login_streak: number;
  last_login: string | null;
  created_at: string;
}

export interface ImageJob {
  id: string;
  tenant_id: string;
  profile_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  prompt: string;
  params: Record<string, unknown>;
  output_url: string | null;
  created_at: string;
}

export interface GeneratedImage {
  id: string;
  tenant_id: string;
  owner_profile_id: string;
  prompt: string;
  params: Record<string, unknown>;
  output_url: string;
  created_at: string;
}

export interface RenderJob {
  id: string;
  tenant_id: string;
  profile_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  input_prompt: string;
  input_assets: Record<string, unknown>;
  supplier_primary: string;
  supplier_fallbacks: string[];
  error_message: string | null;
  cost_supplier: number;
  price_tenant: number;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: string;
  tenant_id: string;
  owner_profile_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  supplier: string;
  input_prompt: string;
  input_assets: Record<string, unknown>;
  output_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Surge.AI — Currency & Economy Types
// ============================================================

export interface SurgeCoinBundle {
  id: string;
  name: string;
  price_gbp: number;
  coins: number;
  popular?: boolean;
}

export interface SurgeBuckBundle {
  id: string;
  name: string;
  price_gbp: number;
  amount: number;
  popular?: boolean;
}

export interface StreakReward {
  day: number;
  coins: number;
}

// ============================================================
// Surge.AI — UI State Types
// ============================================================

export interface AppState {
  user: Profile | null;
  tenant: Tenant | null;
  billing: BillingAccount | null;
  images: GeneratedImage[];
  videos: Video[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type PageRoute = 'dashboard' | 'image-studio' | 'video-engine' | 'billing' | 'rewards';
