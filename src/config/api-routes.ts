/**
 * ============================================================
 * Surge.AI — Backend API Reference
 * ============================================================
 * 
 * This file documents all API routes for the production backend.
 * These would be implemented as Next.js API routes or server functions.
 * 
 * The frontend SPA demonstrates the complete UI/UX and simulates
 * all backend interactions through the store layer.
 * ============================================================
 */

// ============================================================
// API ROUTE MAP
// ============================================================
//
// POST /api/rewards/daily         → Claim daily streak reward
// POST /api/purchase/surge-coins  → Create Stripe checkout for coins
// POST /api/purchase/surge-bucks  → Create Stripe checkout for bucks
// POST /api/stripe/webhook        → Handle Stripe events
// GET  /api/billing/status        → Get current balances
// POST /api/tool/sdxl             → Generate image (deducts 1 coin)
// POST /api/render                → Generate video (deducts bucks)
// GET  /api/images/recent         → Get recent images
// POST /api/supplier/callback     → Supplier video completion callback
//
// ============================================================

// ============================================================
// 1. POST /api/rewards/daily
// ============================================================
export const REWARDS_DAILY = `
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Get profile → tenant → billing
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single();
  
  if (!profile) return Response.json({ error: 'No profile' }, { status: 404 });

  const { data: billing } = await supabase
    .from('billing_accounts')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .single();

  const today = new Date().toISOString().split('T')[0];
  
  // Already claimed today?
  if (billing.last_login === today) {
    return Response.json({
      claimed: true,
      streak: billing.login_streak,
      already_claimed: true,
    });
  }

  // Calculate new streak and reward
  const newStreak = billing.login_streak + 1;
  const rewards = [10, 15, 20, 25, 30]; // Day 1-5+
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
    already_claimed: false,
  });
}
`;

// ============================================================
// 2. POST /api/purchase/surge-coins
// ============================================================
export const PURCHASE_COINS = `
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_SURGE_COINS_STARTER!,
  creator: process.env.STRIPE_SURGE_COINS_CREATOR!,
  pro: process.env.STRIPE_SURGE_COINS_PRO!,
  ultra: process.env.STRIPE_SURGE_COINS_ULTRA!,
};

export async function POST(req: Request) {
  const { packId, tenantId } = await req.json();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const priceId = PRICE_MAP[packId];
  if (!priceId) return Response.json({ error: 'Invalid pack' }, { status: 400 });

  const price = await stripe.prices.retrieve(priceId);
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      type: 'surge_coins',
      coins: price.metadata.coins,
      tenant_id: tenantId,
    },
    success_url: process.env.APP_URL + '/billing?success=true',
    cancel_url: process.env.APP_URL + '/billing?cancelled=true',
  });

  return Response.json({ url: session.url });
}
`;

// ============================================================
// 3. POST /api/purchase/surge-bucks
// ============================================================
export const PURCHASE_BUCKS = `
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_MAP: Record<string, string> = {
  small: process.env.STRIPE_SURGE_BUCKS_SMALL!,
  medium: process.env.STRIPE_SURGE_BUCKS_MEDIUM!,
  large: process.env.STRIPE_SURGE_BUCKS_LARGE!,
};

export async function POST(req: Request) {
  const { packId, tenantId } = await req.json();
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const priceId = PRICE_MAP[packId];
  if (!priceId) return Response.json({ error: 'Invalid pack' }, { status: 400 });

  const price = await stripe.prices.retrieve(priceId);
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      type: 'surge_bucks',
      amount: price.metadata.amount,
      tenant_id: tenantId,
    },
    success_url: process.env.APP_URL + '/billing?success=true',
    cancel_url: process.env.APP_URL + '/billing?cancelled=true',
  });

  return Response.json({ url: session.url });
}
`;

// ============================================================
// 4. POST /api/stripe/webhook
// ============================================================
export const STRIPE_WEBHOOK = `
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return Response.json({ error: 'Invalid signature: ' + err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { type, coins, amount, tenant_id } = session.metadata || {};
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    if (type === 'surge_coins' && coins && tenant_id) {
      // Atomic coin addition via RPC
      const { error } = await supabase.rpc('add_surge_coins', {
        p_tenant_id: tenant_id,
        p_amount: parseInt(coins),
      });
      if (error) console.error('Coin add error:', error);
    }
    
    if (type === 'surge_bucks' && amount && tenant_id) {
      // Atomic buck addition via RPC
      const { error } = await supabase.rpc('add_surge_bucks', {
        p_tenant_id: tenant_id,
        p_amount: parseInt(amount),
      });
      if (error) console.error('Buck add error:', error);
    }
  }

  return Response.json({ received: true });
}

// Disable body parsing for webhook
export const config = { api: { bodyParser: false } };
`;

// ============================================================
// 5. POST /api/tool/sdxl (Image Generation)
// ============================================================
export const TOOL_SDXL = `
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, width = 1024, height = 1024 } = await req.json();
  
  // Resolve tenant
  const { data: profile } = await supabase
    .from('profiles').select('tenant_id').eq('id', user.id).single();
  const { data: billing } = await supabase
    .from('billing_accounts').select('*').eq('tenant_id', profile.tenant_id).single();

  // Check balance
  if (billing.surge_coins < 1) {
    return Response.json({ error: 'NOT_ENOUGH_SURGE_COINS' }, { status: 402 });
  }

  // Atomic deduction
  const { data: success, error: deductError } = await supabase.rpc('deduct_surge_coins', {
    p_tenant_id: profile.tenant_id,
    p_amount: 1,
  });
  if (!success) return Response.json({ error: 'NOT_ENOUGH_SURGE_COINS' }, { status: 402 });

  // Call internal image engine
  const engineResponse = await fetch(process.env.IMAGE_ENGINE_URL + '/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.IMAGE_ENGINE_API_KEY,
    },
    body: JSON.stringify({ prompt, width, height }),
  });
  
  const { image_url } = await engineResponse.json();

  // Save to database
  const { data: image, error: insertError } = await supabase
    .from('images')
    .insert({
      tenant_id: profile.tenant_id,
      owner_profile_id: user.id,
      prompt,
      params: { width, height },
      output_url: image_url,
    })
    .select()
    .single();

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  return Response.json({
    status: 'completed',
    image_url: image.output_url,
    image_id: image.id,
    remaining_coins: billing.surge_coins - 1,
  });
}
`;

// ============================================================
// 6. POST /api/render (Video Generation)
// ============================================================
export const API_RENDER = `
import { createClient } from '@supabase/supabase-js';

const VIDEO_COST_BUCKS = parseInt(process.env.VIDEO_COST_BUCKS || '3');

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { prompt, assets = {} } = await req.json();
  
  // Resolve tenant
  const { data: profile } = await supabase
    .from('profiles').select('tenant_id').eq('id', user.id).single();
  const { data: billing } = await supabase
    .from('billing_accounts').select('*').eq('tenant_id', profile.tenant_id).single();

  // Check balance
  if (billing.surge_bucks < VIDEO_COST_BUCKS) {
    return Response.json({ error: 'NOT_ENOUGH_SURGE_BUCKS' }, { status: 402 });
  }

  // Atomic deduction
  const { data: success } = await supabase.rpc('deduct_surge_bucks', {
    p_tenant_id: profile.tenant_id,
    p_amount: VIDEO_COST_BUCKS,
  });
  if (!success) return Response.json({ error: 'NOT_ENOUGH_SURGE_BUCKS' }, { status: 402 });

  // Create render job
  const { data: job, error: jobError } = await supabase
    .from('render_jobs')
    .insert({
      tenant_id: profile.tenant_id,
      profile_id: user.id,
      status: 'queued',
      input_prompt: prompt,
      input_assets: assets,
      supplier_primary: 'primary',
      supplier_fallbacks: ['fallback-a', 'fallback-b'],
      price_tenant: VIDEO_COST_BUCKS,
    })
    .select()
    .single();

  if (jobError) return Response.json({ error: jobError.message }, { status: 500 });

  // Call video engine (fire and forget — callback will update)
  fetch(process.env.VIDEO_ENGINE_URL + '/render', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.VIDEO_ENGINE_API_KEY,
    },
    body: JSON.stringify({
      job_id: job.id,
      prompt,
      assets,
      callback_url: process.env.APP_URL + '/api/supplier/callback',
    }),
  }).catch(err => console.error('Video engine call failed:', err));

  // Update status to processing
  await supabase.from('render_jobs').update({ status: 'processing' }).eq('id', job.id);

  return Response.json({
    status: 'queued',
    job_id: job.id,
    remaining_bucks: billing.surge_bucks - VIDEO_COST_BUCKS,
  });
}
`;

// ============================================================
// 7. POST /api/supplier/callback
// ============================================================
export const SUPPLIER_CALLBACK = `
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  // Verify internal API key
  const authHeader = req.headers.get('authorization');
  if (authHeader !== 'Bearer ' + process.env.VIDEO_ENGINE_API_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { job_id, status, output_url, error_message, metadata } = await req.json();

  // Update render job
  await supabase.from('render_jobs').update({
    status: status, // 'completed' or 'failed'
    error_message: error_message || null,
    updated_at: new Date().toISOString(),
  }).eq('id', job_id);

  // If completed, create video record
  if (status === 'completed' && output_url) {
    const { data: job } = await supabase
      .from('render_jobs')
      .select('tenant_id, profile_id, input_prompt, input_assets')
      .eq('id', job_id)
      .single();

    await supabase.from('videos').insert({
      tenant_id: job.tenant_id,
      owner_profile_id: job.profile_id,
      status: 'completed',
      supplier: 'surge-engine',
      input_prompt: job.input_prompt,
      input_assets: job.input_assets,
      output_url,
      metadata: metadata || {},
    });
  }

  return Response.json({ received: true });
}
`;

// ============================================================
// 8. GET /api/billing/status
// ============================================================
export const BILLING_STATUS = `
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('tenant_id').eq('id', user.id).single();
  
  const { data: billing } = await supabase
    .from('billing_accounts')
    .select('surge_coins, surge_bucks, login_streak, last_login')
    .eq('tenant_id', profile.tenant_id)
    .single();

  return Response.json(billing);
}
`;

// ============================================================
// 9. GET /api/images/recent
// ============================================================
export const IMAGES_RECENT = `
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') || '20');

  const { data: images } = await supabase
    .from('images')
    .select('*')
    .eq('owner_profile_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  return Response.json({ images: images || [] });
}
`;
