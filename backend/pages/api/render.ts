// ============================================================
// Surge.AI — POST /api/render
// ============================================================
// Initiates video generation via supplier passthrough
// Deducts Surge Bucks, creates render job, calls supplier
// Used by: Video Engine page
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getUserFromRequest } from '@/lib/auth';
import { submitRenderJob } from '@/lib/supplierClient';

const VIDEO_COST_BUCKS = parseInt(process.env.VIDEO_COST_BUCKS || '3');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Parse request body
    const { prompt, assets } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'invalid_prompt' });
    }

    // Fetch billing account
    const { data: billing, error: billingError } = await supabaseAdmin
      .from('billing_accounts')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .single();

    if (billingError || !billing) {
      return res.status(500).json({ error: 'billing_not_found' });
    }

    // Check balance
    if (billing.surge_bucks < VIDEO_COST_BUCKS) {
      return res.status(402).json({
        error: 'NOT_ENOUGH_SURGE_BUCKS',
        required: VIDEO_COST_BUCKS,
        available: billing.surge_bucks,
      });
    }

    // Deduct Surge Bucks (atomic operation)
    const { success: deducted, error: deductError } = await supabaseAdmin.rpc(
      'deduct_surge_bucks',
      {
        p_tenant_id: user.tenant_id,
        p_amount: VIDEO_COST_BUCKS,
      }
    );

    if (!deducted || deductError) {
      console.error('Buck deduction failed:', deductError);
      return res.status(402).json({ error: 'NOT_ENOUGH_SURGE_BUCKS' });
    }

    // Create render job
    const { data: renderJob, error: jobError } = await supabaseAdmin
      .from('render_jobs')
      .insert({
        tenant_id: user.tenant_id,
        profile_id: user.id,
        status: 'queued',
        input_prompt: prompt,
        input_assets: assets || {},
        supplier_primary: 'primary',
        supplier_fallbacks: ['fallback-a', 'fallback-b'],
        price_tenant: VIDEO_COST_BUCKS,
      })
      .select()
      .single();

    if (jobError || !renderJob) {
      console.error('Render job creation failed:', jobError);
      // Refund the bucks
      await supabaseAdmin.rpc('add_surge_bucks', {
        p_tenant_id: user.tenant_id,
        p_amount: VIDEO_COST_BUCKS,
      });
      return res.status(500).json({ error: 'render_job_creation_failed' });
    }

    // Submit to supplier (async, don't wait for response)
    const callbackUrl = `${process.env.APP_URL}/api/supplier/callback`;

    submitRenderJob({
      job_id: renderJob.id,
      prompt,
      assets,
      callback_url: callbackUrl,
    }).catch((error) => {
      console.error('Supplier submission failed:', error);
      // Mark job as failed
      supabaseAdmin
        .from('render_jobs')
        .update({
          status: 'failed',
          error_message: 'Supplier submission failed',
        })
        .eq('id', renderJob.id);
    });

    // Return job info immediately
    return res.status(202).json({
      status: 'queued',
      job_id: renderJob.id,
      remaining_bucks: billing.surge_bucks - VIDEO_COST_BUCKS,
      estimated_time: 30, // seconds
    });
  } catch (error) {
    console.error('Render error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
