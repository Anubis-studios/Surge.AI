// ============================================================
// Surge.AI — POST /api/purchase/surge-bucks
// ============================================================
// Creates Stripe Checkout session for Surge Bucks
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { getUserFromRequest } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const PRICE_MAP: Record<string, string> = {
  small: process.env.STRIPE_SURGE_BUCKS_SMALL || '',
  medium: process.env.STRIPE_SURGE_BUCKS_MEDIUM || '',
  large: process.env.STRIPE_SURGE_BUCKS_LARGE || '',
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

    const price = await stripe.prices.retrieve(priceId);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      meta {
        type: 'surge_bucks',
        amount: price.metadata.amount || '0',
        tenant_id: user.tenant_id,
      },
      success_url: `${process.env.APP_URL}/billing?success=true`,
      cancel_url: `${process.env.APP_URL}/billing?cancelled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Purchase bucks error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
