// ============================================================
// Surge.AI — POST /api/purchase/surge-coins
// ============================================================
// Creates Stripe Checkout session for Surge Coins
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getUserFromRequest } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const PRICE_MAP: Record<string, string> = {
  starter: process.env.STRIPE_SURGE_COINS_STARTER || '',
  creator: process.env.STRIPE_SURGE_COINS_CREATOR || '',
  pro: process.env.STRIPE_SURGE_COINS_PRO || '',
  ultra: process.env.STRIPE_SURGE_COINS_ULTRA || '',
};

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

    const { packId } = req.body;
    const priceId = PRICE_MAP[packId];

    if (!priceId) {
      return res.status(400).json({ error: 'invalid_pack' });
    }

    // Retrieve price to get metadata
    const price = await stripe.prices.retrieve(priceId);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      meta {
        type: 'surge_coins',
        coins: price.metadata.coins || '0',
        tenant_id: user.tenant_id,
      },
      success_url: `${process.env.APP_URL}/billing?success=true`,
      cancel_url: `${process.env.APP_URL}/billing?cancelled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Purchase coins error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
