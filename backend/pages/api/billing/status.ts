// ============================================================
// Surge.AI — GET /api/billing/status
// ============================================================
// Returns current Surge Coins, Surge Bucks, and streak info
// Used by: Dashboard, Image Studio, Video Engine, Billing
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    // Fetch billing account
    const { data: billing, error } = await supabaseAdmin
      .from('billing_accounts')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .single();

    if (error || !billing) {
      console.error('Billing fetch error:', error);
      return res.status(500).json({ error: 'billing_not_found' });
    }

    // Return billing status
    return res.status(200).json({
      surge_coins: billing.surge_coins,
      surge_bucks: billing.surge_bucks,
      login_streak: billing.login_streak,
      last_login: billing.last_login,
    });
  } catch (error) {
    console.error('Billing status error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
