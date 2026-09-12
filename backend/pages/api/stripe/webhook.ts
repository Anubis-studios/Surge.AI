// ============================================================
// Surge.AI — POST /api/stripe/webhook
// ============================================================
// Handles Stripe webhook events for purchase fulfillment
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseClient';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: NextApiRequest) {
  const chunks = [];
  for await (const chunk of readable as any) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      return res.status(400).json({ error: 'missing_signature_or_secret' });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'invalid_signature' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { type, coins, amount, tenant_id } = session.metadata || {};

      if (type === 'surge_coins' && coins && tenant_id) {
        const { error } = await supabaseAdmin.rpc('add_surge_coins', {
          p_tenant_id: tenant_id,
          p_amount: parseInt(coins, 10),
        });
        if (error) console.error('Coin add error:', error);
      }

      if (type === 'surge_bucks' && amount && tenant_id) {
        const { error } = await supabaseAdmin.rpc('add_surge_bucks', {
          p_tenant_id: tenant_id,
          p_amount: parseInt(amount, 10),
        });
        if (error) console.error('Buck add error:', error);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
