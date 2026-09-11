// ============================================================
// Surge.AI — API Hooks for React Components
// ============================================================
// Custom hooks for fetching data from the backend API
// Includes loading states, error handling, and caching
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { billingApi, videosApi, imagesApi, ApiError } from '../lib/apiClient';
import type { BillingStatus, Video, Image } from '../types';

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
      const status = await billingApi.getStatus();
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
      const videos = await videosApi.getRecent(limit);
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
  const [data, setData] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const images = await imagesApi.getRecent(limit);
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
      const result = await videosApi.submitRender(prompt, assets);
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
      const result = await imagesApi.submitGeneration(prompt, params);
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
// Utility: Check if error is insufficient funds
// ============================================================

export function isInsufficientFunds(error: Error | null): boolean {
  if (!error) return false;
  return (
    error instanceof ApiError &&
    (error.code === 'NOT_ENOUGH_SURGE_COINS' ||
      error.code === 'NOT_ENOUGH_SURGE_BUCKS')
  );
}
