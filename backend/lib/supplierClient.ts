// ============================================================
// Surge.AI — Supplier Client (Video Generation Passthrough)
// ============================================================
// Handles communication with external video generation supplier.
// Implements retry logic, fallback suppliers, and callback handling.
// ============================================================

import { supabaseAdmin } from './supabaseClient';

// ============================================================
// Supplier Configuration
// ============================================================

interface SupplierConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  timeout: number;
  maxRetries: number;
}

const PRIMARY_SUPPLIER: SupplierConfig = {
  name: 'primary',
  baseUrl: process.env.SUPPLIER_API_URL || 'https://api.supplier.com/v1',
  apiKey: process.env.SUPPLIER_API_KEY || '',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
};

const FALLBACK_SUPPLIERS: SupplierConfig[] = [
  {
    name: 'fallback-a',
    baseUrl: process.env.SUPPLIER_FALLBACK_A_URL || 'https://api.fallback-a.com/v1',
    apiKey: process.env.SUPPLIER_FALLBACK_A_KEY || '',
    timeout: 30000,
    maxRetries: 2,
  },
  {
    name: 'fallback-b',
    baseUrl: process.env.SUPPLIER_FALLBACK_B_URL || 'https://api.fallback-b.com/v1',
    apiKey: process.env.SUPPLIER_FALLBACK_B_KEY || '',
    timeout: 30000,
    maxRetries: 2,
  },
];

// ============================================================
// Video Render Request
// ============================================================

export interface VideoRenderRequest {
  job_id: string;
  prompt: string;
  assets?: {
    scenes?: string[];
    images?: string[];
    style?: string;
  };
  callback_url: string;
}

export interface VideoRenderResponse {
  success: boolean;
  job_id?: string;
  estimated_time?: number;
  error?: string;
}

// ============================================================
// Submit render job to supplier
// ============================================================

export async function submitRenderJob(
  request: VideoRenderRequest
): Promise<VideoRenderResponse> {
  // Try primary supplier first
  const primaryResult = await trySupplier(PRIMARY_SUPPLIER, request);

  if (primaryResult.success) {
    return primaryResult;
  }

  // If primary fails, try fallback suppliers
  console.warn(`Primary supplier failed: ${primaryResult.error}. Trying fallbacks...`);

  for (const fallback of FALLBACK_SUPPLIERS) {
    const fallbackResult = await trySupplier(fallback, request);

    if (fallbackResult.success) {
      // Update render job with fallback supplier name
      await supabaseAdmin
        .from('render_jobs')
        .update({ supplier_primary: fallback.name })
        .eq('id', request.job_id);

      return fallbackResult;
    }
  }

  // All suppliers failed
  return {
    success: false,
    error: 'All suppliers failed to process the request',
  };
}

// ============================================================
// Try a single supplier with retry logic
// ============================================================

async function trySupplier(
  supplier: SupplierConfig,
  request: VideoRenderRequest
): Promise<VideoRenderResponse> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= supplier.maxRetries; attempt++) {
    try {
      console.log(`Attempting ${supplier.name} (attempt ${attempt}/${supplier.maxRetries})`);

      const response = await fetch(`${supplier.baseUrl}/render`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supplier.apiKey}`,
          'X-Request-ID': request.job_id,
        },
        body: JSON.stringify({
          job_id: request.job_id,
          prompt: request.prompt,
          assets: request.assets,
          callback_url: request.callback_url,
          webhook_secret: process.env.SUPPLIER_WEBHOOK_SECRET,
        }),
        signal: AbortSignal.timeout(supplier.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Update render job status
      await supabaseAdmin
        .from('render_jobs')
        .update({
          status: 'processing',
          supplier_primary: supplier.name,
        })
        .eq('id', request.job_id);

      return {
        success: true,
        job_id: data.job_id || request.job_id,
        estimated_time: data.estimated_time,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`${supplier.name} attempt ${attempt} failed:`, lastError);

      // Wait before retry (exponential backoff)
      if (attempt < supplier.maxRetries) {
        await sleep(1000 * Math.pow(2, attempt - 1));
      }
    }
  }

  return {
    success: false,
    error: lastError,
  };
}

// ============================================================
// Handle supplier callback
// ============================================================

export interface SupplierCallback {
  job_id: string;
  status: 'completed' | 'failed';
  output_url?: string;
  error_message?: string;
  metadata?: {
    duration?: string;
    resolution?: string;
    fps?: number;
    file_size?: number;
  };
  signature: string;
}

export async function handleSupplierCallback(
  callback: SupplierCallback
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify webhook signature
    const isValid = verifyWebhookSignature(callback);
    if (!isValid) {
      return { success: false, error: 'Invalid signature' };
    }

    // Get render job
    const { data: renderJob, error: jobError } = await supabaseAdmin
      .from('render_jobs')
      .select('*')
      .eq('id', callback.job_id)
      .single();

    if (jobError || !renderJob) {
      return { success: false, error: 'Render job not found' };
    }

    // Update render job status
    await supabaseAdmin
      .from('render_jobs')
      .update({
        status: callback.status,
        error_message: callback.error_message || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', callback.job_id);

    // If completed, create video record
    if (callback.status === 'completed' && callback.output_url) {
      await supabaseAdmin.from('videos').insert({
        tenant_id: renderJob.tenant_id,
        owner_profile_id: renderJob.profile_id,
        status: 'completed',
        supplier: renderJob.supplier_primary,
        input_prompt: renderJob.input_prompt,
        input_assets: renderJob.input_assets,
        output_url: callback.output_url,
        metadata: callback.metadata || {},
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Callback handling error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================
// Verify webhook signature
// ============================================================

function verifyWebhookSignature(callback: SupplierCallback): boolean {
  // In production, verify HMAC signature
  // For now, just check that signature exists
  return !!callback.signature;
}

// ============================================================
// Utility: Sleep function
// ============================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Get supplier status (for monitoring)
// ============================================================

export async function getSupplierStatus(): Promise<{
  primary: { name: string; healthy: boolean };
  fallbacks: Array<{ name: string; healthy: boolean }>;
}> {
  const checkHealth = async (supplier: SupplierConfig) => {
    try {
      const response = await fetch(`${supplier.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supplier.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  const primaryHealthy = await checkHealth(PRIMARY_SUPPLIER);
  const fallbackHealthy = await Promise.all(
    FALLBACK_SUPPLIERS.map((s) => checkHealth(s))
  );

  return {
    primary: { name: PRIMARY_SUPPLIER.name, healthy: primaryHealthy },
    fallbacks: FALLBACK_SUPPLIERS.map((s, i) => ({
      name: s.name,
      healthy: fallbackHealthy[i],
    })),
  };
}
