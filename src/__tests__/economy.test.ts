import { describe, it, expect } from 'vitest';
import { 
  SURGE_COIN_BUNDLES, 
  SURGE_BUCK_BUNDLES, 
  STREAK_REWARDS, 
  IMAGE_COST_COINS, 
  VIDEO_COST_BUCKS 
} from '../store';

describe('Economy Configuration', () => {
  describe('Surge Coin Bundles', () => {
    it('should have 4 coin bundles', () => {
      expect(SURGE_COIN_BUNDLES).toHaveLength(4);
    });

    it('should have correct bundle IDs', () => {
      const ids = SURGE_COIN_BUNDLES.map(b => b.id);
      expect(ids).toEqual(['starter', 'creator', 'pro', 'ultra']);
    });

    it('should have correct prices in GBP', () => {
      expect(SURGE_COIN_BUNDLES[0].price_gbp).toBe(3);
      expect(SURGE_COIN_BUNDLES[1].price_gbp).toBe(7);
      expect(SURGE_COIN_BUNDLES[2].price_gbp).toBe(15);
      expect(SURGE_COIN_BUNDLES[3].price_gbp).toBe(30);
    });

    it('should have correct coin amounts', () => {
      expect(SURGE_COIN_BUNDLES[0].coins).toBe(30);
      expect(SURGE_COIN_BUNDLES[1].coins).toBe(80);
      expect(SURGE_COIN_BUNDLES[2].coins).toBe(200);
      expect(SURGE_COIN_BUNDLES[3].coins).toBe(450);
    });

    it('should have one popular bundle', () => {
      const popular = SURGE_COIN_BUNDLES.filter(b => b.popular);
      expect(popular).toHaveLength(1);
      expect(popular[0].id).toBe('creator');
    });

    it('should have increasing value per coin for larger bundles', () => {
      const valuePerCoin = SURGE_COIN_BUNDLES.map(b => b.price_gbp / b.coins);
      for (let i = 1; i < valuePerCoin.length; i++) {
        expect(valuePerCoin[i]).toBeLessThan(valuePerCoin[i - 1]);
      }
    });
  });

  describe('Surge Buck Bundles', () => {
    it('should have 3 buck bundles', () => {
      expect(SURGE_BUCK_BUNDLES).toHaveLength(3);
    });

    it('should have correct bundle IDs', () => {
      const ids = SURGE_BUCK_BUNDLES.map(b => b.id);
      expect(ids).toEqual(['small', 'medium', 'large']);
    });

    it('should have correct prices in GBP', () => {
      expect(SURGE_BUCK_BUNDLES[0].price_gbp).toBe(10);
      expect(SURGE_BUCK_BUNDLES[1].price_gbp).toBe(25);
      expect(SURGE_BUCK_BUNDLES[2].price_gbp).toBe(50);
    });

    it('should have correct buck amounts', () => {
      expect(SURGE_BUCK_BUNDLES[0].amount).toBe(100);
      expect(SURGE_BUCK_BUNDLES[1].amount).toBe(300);
      expect(SURGE_BUCK_BUNDLES[2].amount).toBe(700);
    });

    it('should have one popular bundle', () => {
      const popular = SURGE_BUCK_BUNDLES.filter(b => b.popular);
      expect(popular).toHaveLength(1);
      expect(popular[0].id).toBe('medium');
    });
  });

  describe('Streak Rewards', () => {
    it('should have 5 reward tiers', () => {
      expect(STREAK_REWARDS).toHaveLength(5);
    });

    it('should have correct day progression', () => {
      expect(STREAK_REWARDS[0].day).toBe(1);
      expect(STREAK_REWARDS[4].day).toBe(5);
    });

    it('should have increasing coin rewards', () => {
      for (let i = 1; i < STREAK_REWARDS.length; i++) {
        expect(STREAK_REWARDS[i].coins).toBeGreaterThan(STREAK_REWARDS[i - 1].coins);
      }
    });

    it('should have correct coin values', () => {
      expect(STREAK_REWARDS[0].coins).toBe(10);
      expect(STREAK_REWARDS[1].coins).toBe(15);
      expect(STREAK_REWARDS[2].coins).toBe(20);
      expect(STREAK_REWARDS[3].coins).toBe(25);
      expect(STREAK_REWARDS[4].coins).toBe(30);
    });

    it('should cap at 30 coins per day', () => {
      const maxReward = Math.max(...STREAK_REWARDS.map(r => r.coins));
      expect(maxReward).toBe(30);
    });
  });

  describe('Generation Costs', () => {
    it('should cost 1 coin for image generation', () => {
      expect(IMAGE_COST_COINS).toBe(1);
    });

    it('should cost 3 bucks for video generation', () => {
      expect(VIDEO_COST_BUCKS).toBe(3);
    });

    it('should have positive costs', () => {
      expect(IMAGE_COST_COINS).toBeGreaterThan(0);
      expect(VIDEO_COST_BUCKS).toBeGreaterThan(0);
    });
  });
});
