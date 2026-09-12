// ============================================================
// Surge.AI — POST /api/rewards/daily
// ============================================================
// Claims daily login streak reward
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getUserFromRequest } from '@/lib/auth';

// Streak rewards: Day 1 → 10, Day 2 → 15, Day 3 → 20, Day 4 → 25, Day 5+ → 30
const STREAK_REWARDS = [10, 15, 20, 25, 30];

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

    // Get billing account
    const {  billing, error } = await supabaseAdmin
      .from('billing_accounts')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .single();

    if (error || !billing) {
      return res.status(500).json({ error: 'billing_not_found' });
    }

    const today = new Date().toISOString().split('T')[0];

    // Already claimed today?
    if (billing.last_login === today) {
      return res.status(200).json({
        claimed: true,
        streak: billing.login_streak,
        coins_earned: 0,
        balance: billing.surge_coins,
        already_claimed: true,
      });
    }

    // Calculate new streak and reward
    const newStreak = billing.login_streak + 1;
    const coinsEarned = STREAK_REWARDS[Math.min(newStreak - 1, STREAK_REWARDS.length - 1)];

    // Atomic update
    const { error: updateError } = await supabaseAdmin
      .from('billing_accounts')
      .update({
        login_streak: newStreak,
        last_login: today,
        surge_coins: billing.surge_coins + coinsEarned,
      })
      .eq('id', billing.id);

    if (updateError) {
      console.error('Streak update error:', updateError);
      return res.status(500).json({ error: 'update_failed' });
    }

    return res.status(200).json({
      claimed: true,
      streak: newStreak,
      coins_earned: coinsEarned,
      balance: billing.surge_coins + coinsEarned,
      already_claimed: false,
    });
  } catch (error) {
    console.error('Daily reward error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
