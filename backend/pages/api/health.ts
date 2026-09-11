// ============================================================
// Surge.AI — GET / (Health Check)
// ============================================================
// Simple health check endpoint for monitoring
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    status: 'healthy',
    service: 'surge-ai-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
