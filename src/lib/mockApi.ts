// ============================================================
// Surge.AI — Mock API Service
// ============================================================
// Simulates backend API responses for development/demo mode
// Replace with real API calls when backend is deployed
// ============================================================

import type { BillingStatus, Video, GeneratedImage } from '../types';
import { SURGE_COIN_BUNDLES, SURGE_BUCK_BUNDLES, STREAK_REWARDS } from '../store';

// Simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data storage (in production, this would be in the backend database)
let mockBilling: BillingStatus = {
  surge_coins: 25,
  surge_bucks: 150,
  login_streak: 3,
  last_login: new Date(Date.now() - 86400000).toISOString().split('T')[0],
};

let mockVideos: Video[] = [];
let mockImages: GeneratedImage[] = [];

// Demo image URLs
const DEMO_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1634017839464-5c339afa60f0?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1614851099511-773084f6911d?w=512&h=512&fit=crop',
];

const DEMO_VIDEO_THUMBS = [
  'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=512&h=288&fit=crop',
  'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=512&h=288&fit=crop',
];

// ============================================================
// Mock Billing API
// ============================================================

export const mockBillingApi = {
  async getStatus(): Promise<BillingStatus> {
    await delay(300);
    return { ...mockBilling };
  },

  async addCoins(amount: number): Promise<void> {
    await delay(200);
    mockBilling.surge_coins += amount;
  },

  async addBucks(amount: number): Promise<void> {
    await delay(200);
    mockBilling.surge_bucks += amount;
  },

  async deductCoins(amount: number): Promise<boolean> {
    await delay(200);
    if (mockBilling.surge_coins < amount) {
      return false;
    }
    mockBilling.surge_coins -= amount;
    return true;
  },

  async deductBucks(amount: number): Promise<boolean> {
    await delay(200);
    if (mockBilling.surge_bucks < amount) {
      return false;
    }
    mockBilling.surge_bucks -= amount;
    return true;
  },

  async claimDailyReward(): Promise<{ coins_earned: number; streak: number }> {
    await delay(300);
    const today = new Date().toISOString().split('T')[0];
    
    if (mockBilling.last_login === today) {
      return { coins_earned: 0, streak: mockBilling.login_streak };
    }

    mockBilling.login_streak += 1;
    const rewardIndex = Math.min(mockBilling.login_streak - 1, STREAK_REWARDS.length - 1);
    const coinsEarned = STREAK_REWARDS[rewardIndex].coins;
    
    mockBilling.surge_coins += coinsEarned;
    mockBilling.last_login = today;

    return { coins_earned: coinsEarned, streak: mockBilling.login_streak };
  },
};

// ============================================================
// Mock Videos API
// ============================================================

export const mockVideosApi = {
  async getRecent(limit = 20): Promise<Video[]> {
    await delay(400);
    return mockVideos.slice(0, limit);
  },

  async submitRender(prompt: string, assets?: any): Promise<{
    status: string;
    job_id: string;
    remaining_bucks: number;
    estimated_time: number;
  }> {
    await delay(500);

    if (mockBilling.surge_bucks < 3) {
      throw new Error('NOT_ENOUGH_SURGE_BUCKS');
    }

    mockBilling.surge_bucks -= 3;

    // Simulate video generation
    await delay(2000);

    const videoId = `vid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const thumbUrl = DEMO_VIDEO_THUMBS[Math.floor(Math.random() * DEMO_VIDEO_THUMBS.length)];

    const newVideo: Video = {
      id: videoId,
      tenant_id: 'tenant_001',
      owner_profile_id: 'user_001',
      status: 'completed',
      supplier: 'surge-engine',
      input_prompt: prompt,
      input_assets: assets || {},
      output_url: thumbUrl,
      metadata: { duration: '4s', resolution: '1080p', fps: 24 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockVideos.unshift(newVideo);

    return {
      status: 'completed',
      job_id: videoId,
      remaining_bucks: mockBilling.surge_bucks,
      estimated_time: 2,
    };
  },
};

// ============================================================
// Mock Images API
// ============================================================

export const mockImagesApi = {
  async getRecent(limit = 20): Promise<GeneratedImage[]> {
    await delay(400);
    return mockImages.slice(0, limit);
  },

  async submitGeneration(
    prompt: string,
    params?: { style?: string; width?: number; height?: number }
  ): Promise<{
    status: string;
    image_url: string;
    remaining_coins: number;
  }> {
    await delay(500);

    if (mockBilling.surge_coins < 1) {
      throw new Error('NOT_ENOUGH_SURGE_COINS');
    }

    mockBilling.surge_coins -= 1;

    // Simulate image generation
    await delay(1500);

    const imageId = `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const imageUrl = DEMO_IMAGE_URLS[Math.floor(Math.random() * DEMO_IMAGE_URLS.length)];

    const newImage: GeneratedImage = {
      id: imageId,
      tenant_id: 'tenant_001',
      owner_profile_id: 'user_001',
      prompt,
      params: params || {},
      output_url: imageUrl,
      created_at: new Date().toISOString(),
    };

    mockImages.unshift(newImage);

    return {
      status: 'completed',
      image_url: imageUrl,
      remaining_coins: mockBilling.surge_coins,
    };
  },
};

// ============================================================
// Mock Purchase API
// ============================================================

export const mockPurchaseApi = {
  async createCoinCheckout(packId: string): Promise<{ url: string }> {
    await delay(300);
    const bundle = SURGE_COIN_BUNDLES.find(b => b.id === packId);
    if (!bundle) throw new Error('Invalid pack');
    
    // Simulate successful purchase
    await mockBillingApi.addCoins(bundle.coins);
    
    return { url: '/billing?success=true' };
  },

  async createBuckCheckout(packId: string): Promise<{ url: string }> {
    await delay(300);
    const bundle = SURGE_BUCK_BUNDLES.find(b => b.id === packId);
    if (!bundle) throw new Error('Invalid pack');
    
    // Simulate successful purchase
    await mockBillingApi.addBucks(bundle.amount);
    
    return { url: '/billing?success=true' };
  },
};

// ============================================================
// Export all mock APIs
// ============================================================

export const mockApi = {
  billing: mockBillingApi,
  videos: mockVideosApi,
  images: mockImagesApi,
  purchase: mockPurchaseApi,
};
