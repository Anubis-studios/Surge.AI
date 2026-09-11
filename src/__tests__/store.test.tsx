import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StoreProvider, useStore } from '../store';
import type { ReactNode } from 'react';

// Helper to wrap hooks with StoreProvider
const wrapper = ({ children }: { children: ReactNode }) => (
  <StoreProvider>{children}</StoreProvider>
);

describe('Store', () => {
  describe('Initial State', () => {
    it('should have initial surge coins', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      expect(result.current.state.billing.surge_coins).toBe(25);
    });

    it('should have initial surge bucks', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      expect(result.current.state.billing.surge_bucks).toBe(150);
    });

    it('should have initial streak', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      expect(result.current.state.billing.login_streak).toBe(3);
    });

    it('should have empty images array initially', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      expect(result.current.state.images).toHaveLength(0);
    });

    it('should have empty videos array initially', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      expect(result.current.state.videos).toHaveLength(0);
    });

    it('should have user profile', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      expect(result.current.state.user.display_name).toBe('Alex Creator');
    });

    it('should have tenant info', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      expect(result.current.state.tenant.plan_tier).toBe('creator');
    });
  });

  describe('Image Generation', () => {
    it('should deduct 1 coin when generating image', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialCoins = result.current.state.billing.surge_coins;
      
      act(() => {
        result.current.generateImage('test prompt');
      });
      
      expect(result.current.state.billing.surge_coins).toBe(initialCoins - 1);
    });

    it('should add image to gallery', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      
      act(() => {
        result.current.generateImage('a beautiful sunset');
      });
      
      expect(result.current.state.images).toHaveLength(1);
      expect(result.current.state.images[0].prompt).toBe('a beautiful sunset');
    });

    it('should not generate image without enough coins', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      
      // Exhaust all coins
      act(() => {
        for (let i = 0; i < 30; i++) {
          result.current.generateImage(`prompt ${i}`);
        }
      });
      
      const coinsAfterExhaustion = result.current.state.billing.surge_coins;
      const imagesAfterExhaustion = result.current.state.images.length;
      
      // Try to generate one more
      act(() => {
        result.current.generateImage('should fail');
      });
      
      expect(result.current.state.billing.surge_coins).toBe(coinsAfterExhaustion);
      expect(result.current.state.images).toHaveLength(imagesAfterExhaustion);
    });

    it('should not generate image with empty prompt', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialCoins = result.current.state.billing.surge_coins;
      
      act(() => {
        result.current.generateImage('');
      });
      
      expect(result.current.state.billing.surge_coins).toBe(initialCoins);
      expect(result.current.state.images).toHaveLength(0);
    });

    it('should include style in prompt when style is selected', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      
      act(() => {
        result.current.generateImage('a cat', { style: 'anime' });
      });
      
      expect(result.current.state.images[0].params).toHaveProperty('style', 'anime');
    });
  });

  describe('Video Generation', () => {
    it('should deduct 3 bucks when generating video', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialBucks = result.current.state.billing.surge_bucks;
      
      act(() => {
        result.current.generateVideo('test video prompt');
      });
      
      expect(result.current.state.billing.surge_bucks).toBe(initialBucks - 3);
    });

    it('should add video to gallery', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      
      act(() => {
        result.current.generateVideo('cinematic sunset');
      });
      
      expect(result.current.state.videos).toHaveLength(1);
      expect(result.current.state.videos[0].input_prompt).toBe('cinematic sunset');
    });

    it('should not generate video without enough bucks', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      
      // Exhaust all bucks
      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.generateVideo(`video ${i}`);
        }
      });
      
      const bucksAfterExhaustion = result.current.state.billing.surge_bucks;
      const videosAfterExhaustion = result.current.state.videos.length;
      
      // Try to generate one more
      act(() => {
        result.current.generateVideo('should fail');
      });
      
      expect(result.current.state.billing.surge_bucks).toBe(bucksAfterExhaustion);
      expect(result.current.state.videos).toHaveLength(videosAfterExhaustion);
    });

    it('should not generate video with empty prompt', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialBucks = result.current.state.billing.surge_bucks;
      
      act(() => {
        result.current.generateVideo('');
      });
      
      expect(result.current.state.billing.surge_bucks).toBe(initialBucks);
      expect(result.current.state.videos).toHaveLength(0);
    });
  });

  describe('Purchasing', () => {
    it('should add coins when purchasing coin bundle', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialCoins = result.current.state.billing.surge_coins;
      
      act(() => {
        result.current.purchaseCoins('starter');
      });
      
      expect(result.current.state.billing.surge_coins).toBe(initialCoins + 30);
    });

    it('should add bucks when purchasing buck bundle', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialBucks = result.current.state.billing.surge_bucks;
      
      act(() => {
        result.current.purchaseBucks('small');
      });
      
      expect(result.current.state.billing.surge_bucks).toBe(initialBucks + 100);
    });

    it('should add correct amount for creator pack', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialCoins = result.current.state.billing.surge_coins;
      
      act(() => {
        result.current.purchaseCoins('creator');
      });
      
      expect(result.current.state.billing.surge_coins).toBe(initialCoins + 80);
    });

    it('should add correct amount for pro pack', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialCoins = result.current.state.billing.surge_coins;
      
      act(() => {
        result.current.purchaseCoins('pro');
      });
      
      expect(result.current.state.billing.surge_coins).toBe(initialCoins + 200);
    });

    it('should add correct amount for ultra pack', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialCoins = result.current.state.billing.surge_coins;
      
      act(() => {
        result.current.purchaseCoins('ultra');
      });
      
      expect(result.current.state.billing.surge_coins).toBe(initialCoins + 450);
    });

    it('should add correct amount for medium buck bundle', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialBucks = result.current.state.billing.surge_bucks;
      
      act(() => {
        result.current.purchaseBucks('medium');
      });
      
      expect(result.current.state.billing.surge_bucks).toBe(initialBucks + 300);
    });

    it('should add correct amount for large buck bundle', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialBucks = result.current.state.billing.surge_bucks;
      
      act(() => {
        result.current.purchaseBucks('large');
      });
      
      expect(result.current.state.billing.surge_bucks).toBe(initialBucks + 700);
    });

    it('should not add anything for invalid bundle ID', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialCoins = result.current.state.billing.surge_coins;
      
      act(() => {
        result.current.purchaseCoins('invalid');
      });
      
      expect(result.current.state.billing.surge_coins).toBe(initialCoins);
    });
  });

  describe('Daily Rewards', () => {
    it('should increment streak on claim', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialStreak = result.current.state.billing.login_streak;
      
      act(() => {
        result.current.claimDailyReward();
      });
      
      expect(result.current.state.billing.login_streak).toBe(initialStreak + 1);
    });

    it('should add coins on claim', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      const initialCoins = result.current.state.billing.surge_coins;
      const initialStreak = result.current.state.billing.login_streak;
      
      act(() => {
        result.current.claimDailyReward();
      });
      
      // Day 4 reward should be 25 coins (streak was 3, now 4)
      const expectedReward = [10, 15, 20, 25, 30][Math.min(initialStreak, 4)];
      expect(result.current.state.billing.surge_coins).toBe(initialCoins + expectedReward);
    });

    it('should not allow double claim on same day', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      
      act(() => {
        result.current.claimDailyReward();
      });
      
      const coinsAfterFirstClaim = result.current.state.billing.surge_coins;
      
      act(() => {
        result.current.claimDailyReward();
      });
      
      expect(result.current.state.billing.surge_coins).toBe(coinsAfterFirstClaim);
    });

    it('should set streak claimed flag', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      
      act(() => {
        result.current.claimDailyReward();
      });
      
      expect(result.current.state.streakClaimed).toBe(true);
    });

    it('should set notification on claim', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      
      act(() => {
        result.current.claimDailyReward();
      });
      
      expect(result.current.state.notification).not.toBeNull();
      expect(result.current.state.notification?.type).toBe('success');
    });
  });

  describe('Notifications', () => {
    it('should clear notification', () => {
      const { result } = renderHook(() => useStore(), { wrapper });
      
      act(() => {
        result.current.generateImage('test');
      });
      
      expect(result.current.state.notification).not.toBeNull();
      
      act(() => {
        result.current.clearNotification();
      });
      
      expect(result.current.state.notification).toBeNull();
    });
  });
});
