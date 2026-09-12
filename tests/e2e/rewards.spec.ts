import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard');
}

test.describe('Rewards', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/rewards');
  });

  test('should display Rewards page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Daily Rewards');
  });

  test('should display current streak', async ({ page }) => {
    await expect(page.locator('text=Current Streak')).toBeVisible();
  });

  test('should display claim button', async ({ page }) => {
    const claimButton = page.locator('button', { hasText: /claim today/i });
    await expect(claimButton).toBeVisible();
  });

  test('should display reward schedule', async ({ page }) => {
    await expect(page.locator('text=Reward Schedule')).toBeVisible();
  });

  test('should display all day rewards', async ({ page }) => {
    await expect(page.locator('text=Day 1')).toBeVisible();
    await expect(page.locator('text=Day 2')).toBeVisible();
    await expect(page.locator('text=Day 3')).toBeVisible();
    await expect(page.locator('text=Day 4')).toBeVisible();
    await expect(page.locator('text=Day 5')).toBeVisible();
  });

  test('should display coin amounts for each day', async ({ page }) => {
    await expect(page.locator('text=10').first()).toBeVisible();
    await expect(page.locator('text=15').first()).toBeVisible();
    await expect(page.locator('text=20').first()).toBeVisible();
    await expect(page.locator('text=25').first()).toBeVisible();
    await expect(page.locator('text=30').first()).toBeVisible();
  });

  test('should display streak progress bar', async ({ page }) => {
    await expect(page.locator('text=Streak Progress')).toBeVisible();
  });

  test('should explain what surge coins are', async ({ page }) => {
    await expect(page.locator('text=What are Surge Coins?')).toBeVisible();
  });

  test('should explain how streaks work', async ({ page }) => {
    await expect(page.locator('text=How Streaks Work')).toBeVisible();
  });

  test('should claim daily reward when clicked', async ({ page }) => {
    const claimButton = page.locator('button', { hasText: /claim today/i });
    
    // Only click if not already claimed
    if (await claimButton.isEnabled()) {
      await claimButton.click();
      // Should show success notification or change state
      await page.waitForTimeout(500);
    }
  });
});
