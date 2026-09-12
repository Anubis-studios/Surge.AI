// ============================================================
// Surge.AI — POST /api/supplier/callback
// ============================================================
// Receives completion notifications from video supplier
// Updates render job status and creates video record
// Used by: External supplier API
// ============================================================

import type { NextApiRequest, NextApiResponse } from 'next';
import { handleSupplierCallback, type SupplierCallback } from '@/lib/supplierClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    // Parse callback payload
    const callback: SupplierCallback = req.body;

    // Validate required fields
    if (!callback.job_id || !callback.status || !callback.signature) {
      return res.status(400).json({ error: 'invalid_callback_payload' });
    }

    if (!['completed', 'failed'].includes(callback.status)) {
      return res.status(400).json({ error: 'invalid_status' });
    }

    // Handle the callback
    const result = await handleSupplierCallback(callback);

    if (!result.success) {
      console.error('Callback handling failed:', result.error);
      return res.status(400).json({ error: result.error });
    }

    // Return success
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).json({ error: 'internal_server_error' });
  }
}
