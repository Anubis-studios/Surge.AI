// ============================================================
// Surge.AI — Frontend API Client
// ============================================================
// Handles all API calls from the frontend to the backend
// Includes error handling, authentication, and type safety
// ============================================================

import type { BillingStatus, Video, Image } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// ============================================================
// Generic fetch wrapper with error handling
// ============================================================

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'unknown_error' }));
      throw new ApiError(error.error || 'api_error', response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('network_error', 0);
  }
}

// ============================================================
// Custom error class for API errors
// ============================================================

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number
  ) {
    super(`API Error: ${code} (status: ${status})`);
    this.name = 'ApiError';
  }
}

// ============================================================
// Billing API
// ============================================================

export const billingApi = {
  /**
   * Get current billing status (coins, bucks, streak)
   */
  async getStatus(): Promise<BillingStatus> {
    return fetchApi<BillingStatus>('/api/billing/status');
  },
};

// ============================================================
// Videos API
// ============================================================

export const videosApi = {
  /**
   * Get recent videos for the gallery
   */
  async getRecent(limit = 20, offset = 0): Promise<Video[]> {
    return fetchApi<Video[]>(
      `/api/videos/recent?limit=${limit}&offset=${offset}`
    );
  },

  /**
   * Submit a video render job
   */
  async submitRender(prompt: string, assets?: any): Promise<{
    status: string;
    job_id: string;
    remaining_bucks: number;
    estimated_time: number;
  }> {
    return fetchApi('/api/render', {
      method: 'POST',
      body: JSON.stringify({ prompt, assets }),
    });
  },
};

// ============================================================
// Images API
// ============================================================

export const imagesApi = {
  /**
   * Get recent images for the gallery
   */
  async getRecent(limit = 20, offset = 0): Promise<Image[]> {
    return fetchApi<Image[]>(
      `/api/images/recent?limit=${limit}&offset=${offset}`
    );
  },

  /**
   * Submit an image generation job
   */
  async submitGeneration(
    prompt: string,
    params?: { style?: string; width?: number; height?: number }
  ): Promise<{
    status: string;
    image_url: string;
    remaining_coins: number;
  }> {
    return fetchApi('/api/tool/sdxl', {
      method: 'POST',
      body: JSON.stringify({ prompt, ...params }),
    });
  },
};

// ============================================================
// Rewards API
// ============================================================

export const rewardsApi = {
  /**
   * Claim daily login reward
   */
  async claimDaily(): Promise<{
    claimed: boolean;
    streak: number;
    coins_earned: number;
    balance: number;
  }> {
    return fetchApi('/api/rewards/daily', {
      method: 'POST',
    });
  },
};

// ============================================================
// Purchase API
// ============================================================

export const purchaseApi = {
  /**
   * Create Stripe checkout session for Surge Coins
   */
  async createCoinCheckout(packId: string): Promise<{ url: string }> {
    return fetchApi('/api/purchase/surge-coins', {
      method: 'POST',
      body: JSON.stringify({ packId }),
    });
  },

  /**
   * Create Stripe checkout session for Surge Bucks
   */
  async createBuckCheckout(packId: string): Promise<{ url: string }> {
    return fetchApi('/api/purchase/surge-bucks', {
      method: 'POST',
      body: JSON.stringify({ packId }),
    });
  },
};

// ============================================================
// Utility: Check if error is insufficient funds
// ============================================================

export function isInsufficientFundsError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === 'NOT_ENOUGH_SURGE_COINS' ||
      error.code === 'NOT_ENOUGH_SURGE_BUCKS')
  );
}

// ============================================================
// Utility: Check if error is unauthorized
// ============================================================

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
