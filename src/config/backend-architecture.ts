/**
 * ============================================================
 * Surge.AI — Backend Architecture Reference
 * ============================================================
 * 
 * This file documents the production backend architecture that
 * would be implemented with Next.js API routes + Supabase + Stripe.
 * 
 * The frontend SPA demonstrates the complete UI/UX and simulates
 * all backend interactions through the store layer.
 * ============================================================
 */

// ============================================================
// 1. SUPABASE SCHEMA (PostgreSQL)
// ============================================================

export const SUPABASE_SCHEMA_SQL = `
-- Tenants
CREATE TABLE tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  plan_tier text DEFAULT 'free',
  created_at timestamptz DEFAULT now()
);

-- Profiles (auth users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  tenant_id uuid REFERENCES tenants(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Billing accounts (dual currency)
CREATE TABLE billing_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  stripe_customer_id text,
  surge_coins integer DEFAULT 0 NOT NULL,
  surge_bucks integer DEFAULT 0 NOT NULL,
  login_streak integer DEFAULT 0 NOT NULL,
  last_login date,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT positive_coins CHECK (surge_coins >= 0),
  CONSTRAINT positive_bucks CHECK (surge_bucks >= 0)
);

-- Image generation jobs
CREATE TABLE image_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  profile_id uuid REFERENCES profiles(id) NOT NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed')),
  prompt text NOT NULL,
  params jsonb DEFAULT '{}',
  output_url text,
  created_at timestamptz DEFAULT now()
);

-- Generated images (completed)
CREATE TABLE images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  owner_profile_id uuid REFERENCES profiles(id) NOT NULL,
  prompt text NOT NULL,
  params jsonb DEFAULT '{}',
  output_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Video render jobs
CREATE TABLE render_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  profile_id uuid REFERENCES profiles(id) NOT NULL,
  status text DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed')),
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

-- Generated videos (completed)
CREATE TABLE videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES tenants(id) NOT NULL,
  owner_profile_id uuid REFERENCES profiles(id) NOT NULL,
  status text DEFAULT 'queued',
  supplier text,
  input_prompt text NOT NULL,
  input_assets jsonb DEFAULT '{}',
  output_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_billing_tenant ON billing_accounts(tenant_id);
CREATE INDEX idx_images_tenant ON images(tenant_id);
CREATE INDEX idx_images_owner ON images(owner_profile_id);
CREATE INDEX idx_videos_tenant ON videos(tenant_id);
CREATE INDEX idx_render_jobs_tenant ON render_jobs(tenant_id);
CREATE INDEX idx_image_jobs_tenant ON image_jobs(tenant_id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can read their billing via tenant membership
CREATE POLICY "Users can view own billing" ON billing_accounts
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.uid())
  );

-- Users can view their own images
CREATE POLICY "Users can view own images" ON images
  FOR SELECT USING (owner_profile_id = auth.uid());

-- Users can view their own videos
CREATE POLICY "Users can view own videos" ON videos
  FOR SELECT USING (owner_profile_id = auth.uid());

-- Storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true);
`;

// ============================================================
// 2. STRIPE CONFIGURATION
// ============================================================

export const STRIPE_PRODUCTS = {
  surge_coins: [
    { id: 'starter', name: 'Starter Pack', price_gbp: 300, coins: 30 },    // £3.00
    { id: 'creator', name: 'Creator Pack', price_gbp: 700, coins: 80 },    // £7.00
    { id: 'pro', name: 'Pro Pack', price_gbp: 1500, coins: 200 },          // £15.00
    { id: 'ultra', name: 'Ultra Pack', price_gbp: 3000, coins: 450 },      // £30.00
  ],
  surge_bucks: [
    { id: 'small', name: 'Small', price_gbp: 1000, amount: 100 },          // £10.00
    { id: 'medium', name: 'Medium', price_gbp: 2500, amount: 300 },        // £25.00
    { id: 'large', name: 'Large', price_gbp: 5000, amount: 700 },          // £50.00
  ],
};

// ============================================================
// 3. API ROUTE HANDLERS (Next.js App Router)
// ============================================================

/**
 * POST /api/rewards/daily
 * Claims daily login streak reward
 */
export const DAILY_REWARD_HANDLER = `
export async function POST(req: Request) {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Get profile and billing
  const { data: profile } = await supabase
    .from('profiles').select('tenant_id').eq('id', user.id).single();
  
  const { data: billing } = await supabase
    .from('billing_accounts').select('*').eq('tenant_id', profile.tenant_id).single();

  const today = new Date().toISOString().split('T')[0];
  
  if (billing.last_login === today) {
    return Response.json({ claimed: true, streak: billing.login_streak });
  }

  const newStreak = billing.login_streak + 1;
  const rewards = [10, 15, 20, 25, 30];
  const coinsEarned = rewards[Math.min(newStreak - 1, rewards.length - 1)];

  // Atomic update
  const { error } = await supabase
    .from('billing_accounts')
    .update({
      login_streak: newStreak,
      last_login: today,
      surge_coins: billing.surge_coins + coinsEarned,
    })
    .eq('id', billing.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    claimed: true,
    streak: newStreak,
    coins_earned: coinsEarned,
    balance: billing.surge_coins + coinsEarned,
  });
}
`;

/**
 * POST /api/purchase/surge-coins
 * Creates Stripe Checkout for Surge Coins
 */
export const PURCHASE_COINS_HANDLER = `
export async function POST(req: Request) {
  const { packId, tenantId } = await req.json();
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const pack = SURGE_COIN_BUNDLES.find(p => p.id === packId);
  if (!pack) return Response.json({ error: 'Invalid pack' }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'gbp',
        product_data: { name: pack.name },
        unit_amount: pack.price_gbp * 100,
      },
      quantity: 1,
    }],
    metadata: {
      type: 'surge_coins',
      coins: String(pack.coins),
      tenant_id: tenantId,
    },
    success_url: process.env.APP_URL + '/billing?success=true',
    cancel_url: process.env.APP_URL + '/billing?cancelled=true',
  });

  return Response.json({ url: session.url });
}
`;

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 */
export const WEBHOOK_HANDLER = `
export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { type, coins, amount, tenant_id } = session.metadata;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    if (type === 'surge_coins') {
      await supabase.rpc('add_surge_coins', {
        p_tenant_id: tenant_id,
        p_amount: parseInt(coins),
      });
    } else if (type === 'surge_bucks') {
      await supabase.rpc('add_surge_bucks', {
        p_tenant_id: tenant_id,
        p_amount: parseInt(amount),
      });
    }
  }

  return Response.json({ received: true });
}
`;

/**
 * POST /tool/sdxl
 * Image generation via SDXL tool endpoint
 */
export const SDXL_TOOL_HANDLER = `
export async function POST(req: Request) {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, width, height } = await req.json();
  
  // Get billing
  const { data: profile } = await supabase
    .from('profiles').select('tenant_id').eq('id', user.id).single();
  const { data: billing } = await supabase
    .from('billing_accounts').select('*').eq('tenant_id', profile.tenant_id).single();

  // Check balance
  if (billing.surge_coins < 1) {
    return Response.json({ error: 'NOT_ENOUGH_SURGE_COINS' }, { status: 402 });
  }

  // Deduct coin (atomic)
  const { error: deductError } = await supabase
    .from('billing_accounts')
    .update({ surge_coins: billing.surge_coins - 1 })
    .eq('id', billing.id);
  if (deductError) return Response.json({ error: deductError.message }, { status: 500 });

  // Call SDXL endpoint
  const sdxlResponse = await fetch(process.env.SDXL_ENDPOINT + '/sdxl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, width: width || 1024, height: height || 1024 }),
  });
  const { local_path } = await sdxlResponse.json();

  // Upload to Supabase Storage
  const fileBuffer = await fs.readFile(local_path);
  const fileName = \`sdxl_\${Date.now()}_\${crypto.randomUUID()}.png\`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('images')
    .upload(fileName, fileBuffer, { contentType: 'image/png' });

  if (uploadError) return Response.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);

  // Save to images table
  await supabase.from('images').insert({
    tenant_id: profile.tenant_id,
    owner_profile_id: user.id,
    prompt,
    params: { width, height },
    output_url: urlData.publicUrl,
  });

  return Response.json({ status: 'completed', image_url: urlData.publicUrl });
}
`;

/**
 * POST /api/render
 * Video generation via supplier passthrough
 */
export const RENDER_HANDLER = `
export async function POST(req: Request) {
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, assets } = await req.json();
  const COST_PER_RENDER = 3; // Surge Bucks

  // Get billing
  const { data: profile } = await supabase
    .from('profiles').select('tenant_id').eq('id', user.id).single();
  const { data: billing } = await supabase
    .from('billing_accounts').select('*').eq('tenant_id', profile.tenant_id).single();

  // Check balance
  if (billing.surge_bucks < COST_PER_RENDER) {
    return Response.json({ error: 'NOT_ENOUGH_SURGE_BUCKS' }, { status: 402 });
  }

  // Deduct bucks (atomic)
  await supabase
    .from('billing_accounts')
    .update({ surge_bucks: billing.surge_bucks - COST_PER_RENDER })
    .eq('id', billing.id);

  // Create render job
  const { data: job } = await supabase.from('render_jobs').insert({
    tenant_id: profile.tenant_id,
    profile_id: user.id,
    status: 'queued',
    input_prompt: prompt,
    input_assets: assets || {},
    supplier_primary: 'wireflow-v2',
    supplier_fallbacks: ['runway-gen3', 'pika-v1'],
    cost_supplier: 0.05,
    price_tenant: COST_PER_RENDER,
  }).select().single();

  // Call supplier API
  try {
    await fetch(process.env.SUPPLIER_API_URL + '/render', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${process.env.SUPPLIER_API_KEY}\`,
      },
      body: JSON.stringify({
        job_id: job.id,
        prompt,
        assets,
        callback_url: process.env.APP_URL + '/api/supplier/callback',
      }),
    });

    await supabase.from('render_jobs').update({ status: 'processing' }).eq('id', job.id);
  } catch (error) {
    // Try fallback supplier
    // ... fallback logic
  }

  return Response.json({ status: 'queued', job_id: job.id });
}
`;

// ============================================================
// 4. SDXL PYTHON TOOL ENDPOINT
// ============================================================

export const SDXL_PYTHON_ENDPOINT = `
# sdxl_server.py — FastAPI SDXL Tool Endpoint
from fastapi import FastAPI
from diffusers import StableDiffusionXLPipeline
import torch
import uuid
import uvicorn

app = FastAPI()

# Load model (run once at startup)
pipe = StableDiffusionXLPipeline.from_pretrained(
    "stabilityai/stable-diffusion-xl-base-1.0",
    torch_dtype=torch.float16,
    variant="fp16"
).to("cuda")

@app.post("/sdxl")
async def generate(params: dict):
    prompt = params.get("prompt", "")
    width = params.get("width", 1024)
    height = params.get("height", 1024)
    
    image = pipe(
        prompt=prompt,
        width=width,
        height=height,
        num_inference_steps=30,
        guidance_scale=7.5,
    ).images[0]
    
    filename = f"/tmp/sdxl_{uuid.uuid4()}.png"
    image.save(filename)
    
    return {"local_path": filename}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;

// ============================================================
// 5. ENVIRONMENT VARIABLES
// ============================================================

export const ENV_VARS = `
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# SDXL Tool Endpoint
SDXL_ENDPOINT=http://sdxl-server:8000

# Video Supplier API
SUPPLIER_API_URL=https://api.wireflow.ai/v2
SUPPLIER_API_KEY=your-supplier-key

# App
APP_URL=https://surge.ai
`;
