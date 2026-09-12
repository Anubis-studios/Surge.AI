// ============================================================
// Surge.AI — GET /api/videos/recent
// ============================================================
// Returns recent videos for the Video Engine gallery
// Used by: Video Engine page
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

    // Parse query parameters
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Fetch recent videos
    const { data: videos, error } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Videos fetch error:', error);
      return res.status(500).json({ error: 'video_fetch_failed' });
    }

    // Return videos array
    return res.status(200).json(videos || []);
  } catch (error) {
    console.error('Recent videos error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
