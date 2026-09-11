// ============================================================
// Surge.AI — POST /api/tool/sdxl
// ============================================================
// Image generation via internal image engine
// Deducts 1 Surge Coin per generation
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getUserFromRequest } from '@/lib/auth';

const IMAGE_COST_COINS = parseInt(process.env.IMAGE_COST_COINS || '1');

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const { prompt, width = 1024, height = 1024, style } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'invalid_prompt' });
    }

    // Fetch billing
    const {  billing, error: billingError } = await supabaseAdmin
      .from('billing_accounts')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .single();

    if (billingError || !billing) {
      return res.status(500).json({ error: 'billing_not_found' });
    }

    // Check balance
    if (billing.surge_coins < IMAGE_COST_COINS) {
      return res.status(402).json({
        error: 'NOT_ENOUGH_SURGE_COINS',
        required: IMAGE_COST_COINS,
        available: billing.surge_coins,
      });
    }

    // Atomic deduction
    const { success } = await supabaseAdmin.rpc('deduct_surge_coins', {
      p_tenant_id: user.tenant_id,
      p_amount: IMAGE_COST_COINS,
    });

    if (!success) {
      return res.status(402).json({ error: 'NOT_ENOUGH_SURGE_COINS' });
    }

    // Call internal image engine
    let imageUrl: string;
    try {
      const engineResponse = await fetch(`${process.env.IMAGE_ENGINE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.IMAGE_ENGINE_API_KEY}`,
        },
        body: JSON.stringify({ prompt, width, height, style }),
        signal: AbortSignal.timeout(60000),
      });

      if (!engineResponse.ok) {
        throw new Error(`Engine error: ${engineResponse.status}`);
      }

      const engineData = await engineResponse.json();
      imageUrl = engineData.image_url;
    } catch (engineError) {
      console.error('Image engine error:', engineError);
      // Refund the coin
      await supabaseAdmin.rpc('add_surge_coins', {
        p_tenant_id: user.tenant_id,
        p_amount: IMAGE_COST_COINS,
      });
      return res.status(500).json({ error: 'generation_failed' });
    }

    // Save to database
    const {  image, error: insertError } = await supabaseAdmin
      .from('images')
      .insert({
        tenant_id: user.tenant_id,
        owner_profile_id: user.id,
        prompt,
        params: { width, height, style },
        output_url: imageUrl,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Image insert error:', insertError);
    }

    return res.status(200).json({
      status: 'completed',
      image_url: imageUrl,
      image_id: image?.id,
      remaining_coins: billing.surge_coins - IMAGE_COST_COINS,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
