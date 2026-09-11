import React, { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type { Profile, Tenant, BillingAccount, GeneratedImage, Video, SurgeCoinBundle, SurgeBuckBundle, StreakReward } from '../types';

// ============================================================
// Constants — Economy Configuration
// ============================================================

export const SURGE_COIN_BUNDLES: SurgeCoinBundle[] = [
  { id: 'starter', name: 'Starter Pack', price_gbp: 3, coins: 30 },
  { id: 'creator', name: 'Creator Pack', price_gbp: 7, coins: 80, popular: true },
  { id: 'pro', name: 'Pro Pack', price_gbp: 15, coins: 200 },
  { id: 'ultra', name: 'Ultra Pack', price_gbp: 30, coins: 450 },
];

export const SURGE_BUCK_BUNDLES: SurgeBuckBundle[] = [
  { id: 'small', name: 'Small', price_gbp: 10, amount: 100 },
  { id: 'medium', name: 'Medium', price_gbp: 25, amount: 300, popular: true },
  { id: 'large', name: 'Large', price_gbp: 50, amount: 700 },
];

export const STREAK_REWARDS: StreakReward[] = [
  { day: 1, coins: 10 },
  { day: 2, coins: 15 },
  { day: 3, coins: 20 },
  { day: 4, coins: 25 },
  { day: 5, coins: 30 },
];

export const IMAGE_COST_COINS = 1;
export const VIDEO_COST_BUCKS = 3;

// ============================================================
// State & Actions
// ============================================================

interface State {
  user: Profile;
  tenant: Tenant;
  billing: BillingAccount;
  images: GeneratedImage[];
  videos: Video[];
  streakClaimed: boolean;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
}

type Action =
  | { type: 'SET_NOTIFICATION'; payload: State['notification'] }
  | { type: 'ADD_COINS'; payload: number }
  | { type: 'ADD_BUCKS'; payload: number }
  | { type: 'DEDUCT_COINS'; payload: number }
  | { type: 'DEDUCT_BUCKS'; payload: number }
  | { type: 'UPDATE_STREAK'; payload: { streak: number; lastLogin: string; coinsEarned: number } }
  | { type: 'ADD_IMAGE'; payload: GeneratedImage }
  | { type: 'ADD_VIDEO'; payload: Video }
  | { type: 'SET_STREAK_CLAIMED'; payload: boolean }
  | { type: 'UPDATE_IMAGE_STATUS'; payload: { id: string; status: string; output_url?: string } }
  | { type: 'UPDATE_VIDEO_STATUS'; payload: { id: string; status: string; output_url?: string } };

const initialUser: Profile = {
  id: 'usr_demo_001',
  email: 'creator@surge.ai',
  display_name: 'Alex Creator',
  avatar_url: null,
  tenant_id: 'tenant_001',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const initialTenant: Tenant = {
  id: 'tenant_001',
  name: 'Alex\'s Studio',
  slug: 'alex-studio',
  plan_tier: 'creator',
  created_at: new Date().toISOString(),
};

const initialBilling: BillingAccount = {
  id: 'billing_001',
  tenant_id: 'tenant_001',
  stripe_customer_id: 'cus_demo_123',
  surge_coins: 25,
  surge_bucks: 150,
  login_streak: 3,
  last_login: new Date(Date.now() - 86400000).toISOString().split('T')[0],
  created_at: new Date().toISOString(),
};

const initialState: State = {
  user: initialUser,
  tenant: initialTenant,
  billing: initialBilling,
  images: [],
  videos: [],
  streakClaimed: false,
  notification: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_NOTIFICATION':
      return { ...state, notification: action.payload };
    case 'ADD_COINS':
      return { ...state, billing: { ...state.billing, surge_coins: state.billing.surge_coins + action.payload } };
    case 'ADD_BUCKS':
      return { ...state, billing: { ...state.billing, surge_bucks: state.billing.surge_bucks + action.payload } };
    case 'DEDUCT_COINS':
      return { ...state, billing: { ...state.billing, surge_coins: Math.max(0, state.billing.surge_coins - action.payload) } };
    case 'DEDUCT_BUCKS':
      return { ...state, billing: { ...state.billing, surge_bucks: Math.max(0, state.billing.surge_bucks - action.payload) } };
    case 'UPDATE_STREAK':
      return {
        ...state,
        billing: {
          ...state.billing,
          login_streak: action.payload.streak,
          last_login: action.payload.lastLogin,
          surge_coins: state.billing.surge_coins + action.payload.coinsEarned,
        },
        streakClaimed: true,
      };
    case 'ADD_IMAGE':
      return { ...state, images: [action.payload, ...state.images] };
    case 'ADD_VIDEO':
      return { ...state, videos: [action.payload, ...state.videos] };
    case 'SET_STREAK_CLAIMED':
      return { ...state, streakClaimed: action.payload };
    case 'UPDATE_IMAGE_STATUS':
      return {
        ...state,
        images: state.images.map(img =>
          img.id === action.payload.id
            ? { ...img, output_url: action.payload.output_url || img.output_url }
            : img
        ),
      };
    case 'UPDATE_VIDEO_STATUS':
      return {
        ...state,
        videos: state.videos.map(v =>
          v.id === action.payload.id
            ? { ...v, status: action.payload.status as Video['status'], output_url: action.payload.output_url || v.output_url }
            : v
        ),
      };
    default:
      return state;
  }
}

// ============================================================
// Context
// ============================================================

interface StoreContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
  claimDailyReward: () => void;
  generateImage: (prompt: string, params?: Record<string, unknown>) => void;
  generateVideo: (prompt: string, assets?: Record<string, unknown>) => void;
  purchaseCoins: (bundleId: string) => void;
  purchaseBucks: (bundleId: string) => void;
  clearNotification: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

// ============================================================
// Placeholder images for demo
// ============================================================

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
// Provider
// ============================================================

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const clearNotification = useCallback(() => {
    dispatch({ type: 'SET_NOTIFICATION', payload: null });
  }, []);

  const claimDailyReward = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.streakClaimed) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { message: 'Reward already claimed today!', type: 'info' } });
      return;
    }
    if (state.billing.last_login === today) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { message: 'Reward already claimed today!', type: 'info' } });
      dispatch({ type: 'SET_STREAK_CLAIMED', payload: true });
      return;
    }

    const newStreak = state.billing.login_streak + 1;
    const rewardIndex = Math.min(newStreak - 1, STREAK_REWARDS.length - 1);
    const coinsEarned = STREAK_REWARDS[rewardIndex].coins;

    dispatch({
      type: 'UPDATE_STREAK',
      payload: { streak: newStreak, lastLogin: today, coinsEarned },
    });
    dispatch({
      type: 'SET_NOTIFICATION',
      payload: { message: `Day ${newStreak} streak! +${coinsEarned} Surge Coins earned!`, type: 'success' },
    });
  }, [state.streakClaimed, state.billing.last_login, state.billing.login_streak]);

  const generateImage = useCallback((prompt: string, params?: Record<string, unknown>) => {
    if (state.billing.surge_coins < IMAGE_COST_COINS) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { message: 'Not enough Surge Coins! Purchase more in Billing.', type: 'error' } });
      return;
    }

    dispatch({ type: 'DEDUCT_COINS', payload: IMAGE_COST_COINS });

    const imageId = `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const imageUrl = DEMO_IMAGE_URLS[Math.floor(Math.random() * DEMO_IMAGE_URLS.length)];

    const newImage: GeneratedImage = {
      id: imageId,
      tenant_id: state.tenant.id,
      owner_profile_id: state.user.id,
      prompt,
      params: params || {},
      output_url: imageUrl,
      created_at: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_IMAGE', payload: newImage });
    dispatch({ type: 'SET_NOTIFICATION', payload: { message: 'Image generated successfully! -1 Surge Coin', type: 'success' } });
  }, [state.billing.surge_coins, state.tenant.id, state.user.id]);

  const generateVideo = useCallback((prompt: string, assets?: Record<string, unknown>) => {
    if (state.billing.surge_bucks < VIDEO_COST_BUCKS) {
      dispatch({ type: 'SET_NOTIFICATION', payload: { message: 'Not enough Surge Bucks! Purchase more in Billing.', type: 'error' } });
      return;
    }

    dispatch({ type: 'DEDUCT_BUCKS', payload: VIDEO_COST_BUCKS });

    const videoId = `vid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const thumbUrl = DEMO_VIDEO_THUMBS[Math.floor(Math.random() * DEMO_VIDEO_THUMBS.length)];

    const newVideo: Video = {
      id: videoId,
      tenant_id: state.tenant.id,
      owner_profile_id: state.user.id,
      status: 'completed',
      supplier: 'wireflow-v2',
      input_prompt: prompt,
      input_assets: assets || {},
      output_url: thumbUrl,
      metadata: { duration: '4s', resolution: '1080p', fps: 24 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_VIDEO', payload: newVideo });
    dispatch({ type: 'SET_NOTIFICATION', payload: { message: `Video render complete! -${VIDEO_COST_BUCKS} Surge Bucks`, type: 'success' } });
  }, [state.billing.surge_bucks, state.tenant.id, state.user.id]);

  const purchaseCoins = useCallback((bundleId: string) => {
    const bundle = SURGE_COIN_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) return;
    // Simulate Stripe checkout success
    dispatch({ type: 'ADD_COINS', payload: bundle.coins });
    dispatch({ type: 'SET_NOTIFICATION', payload: { message: `+${bundle.coins} Surge Coins added! (£${bundle.price_gbp})`, type: 'success' } });
  }, []);

  const purchaseBucks = useCallback((bundleId: string) => {
    const bundle = SURGE_BUCK_BUNDLES.find(b => b.id === bundleId);
    if (!bundle) return;
    dispatch({ type: 'ADD_BUCKS', payload: bundle.amount });
    dispatch({ type: 'SET_NOTIFICATION', payload: { message: `+${bundle.amount} Surge Bucks added! (£${bundle.price_gbp})`, type: 'success' } });
  }, []);

  return (
    <StoreContext.Provider value={{
      state,
      dispatch,
      claimDailyReward,
      generateImage,
      generateVideo,
      purchaseCoins,
      purchaseBucks,
      clearNotification,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
