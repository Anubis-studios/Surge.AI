// ============================================================
// Surge.AI — API Hooks for React Components
// ============================================================
// Custom hooks for fetching data from the backend API
// Uses mock API in development, real API in production
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { mockApi } from '../lib/mockApi';
import type { BillingStatus, Video, GeneratedImage } from '../types';

// ============================================================
// useBillingStatus Hook
// ============================================================

export function useBillingStatus() {
  const [data, setData] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await mockApi.billing.getStatus();
      setData(status);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch billing status'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ============================================================
// useRecentVideos Hook
// ============================================================

export function useRecentVideos(limit = 20) {
  const [data, setData] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const videos = await mockApi.videos.getRecent(limit);
      setData(videos);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch videos'));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ============================================================
// useRecentImages Hook
// ============================================================

export function useRecentImages(limit = 20) {
  const [data, setData] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const images = await mockApi.images.getRecent(limit);
      setData(images);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch images'));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ============================================================
// useVideoRender Hook
// ============================================================

export function useVideoRender() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const submitRender = useCallback(async (prompt: string, assets?: any) => {
    setLoading(true);
    setError(null);
    setJobId(null);
    try {
      const result = await mockApi.videos.submitRender(prompt, assets);
      setJobId(result.job_id);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to submit render');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitRender, loading, error, jobId };
}

// ============================================================
// useImageGeneration Hook
// ============================================================

export function useImageGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const submitGeneration = useCallback(async (
    prompt: string,
    params?: { style?: string; width?: number; height?: number }
  ) => {
    setLoading(true);
    setError(null);
    setImageUrl(null);
    try {
      const result = await mockApi.images.submitGeneration(prompt, params);
      setImageUrl(result.image_url);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate image');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitGeneration, loading, error, imageUrl };
}

// ============================================================
// useDailyReward Hook
// ============================================================

export function useDailyReward() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<{ coins_earned: number; streak: number } | null>(null);

  const claimReward = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const reward = await mockApi.billing.claimDailyReward();
      setResult(reward);
      return reward;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to claim reward');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { claimReward, loading, error, result };
}

// ============================================================
// usePurchase Hook
// ============================================================

export function usePurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const purchaseCoins = useCallback(async (packId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mockApi.purchase.createCoinCheckout(packId);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to purchase coins');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const purchaseBucks = useCallback(async (packId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mockApi.purchase.createBuckCheckout(packId);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to purchase bucks');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { purchaseCoins, purchaseBucks, loading, error };
}
