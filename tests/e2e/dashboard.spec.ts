import { test, expect } from '@playwright/test';

// Helper to login before each test
async function login(page: any) {
  await page.goto('/');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard');
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display user welcome message', async ({ page }) => {
    await expect(page.locator('text=Welcome back, Alex Creator')).toBeVisible();
  });

  test('should display Surge Coins balance', async ({ page }) => {
    await expect(page.locator('text=Surge Coins')).toBeVisible();
    // Balance should be a number
    const balance = page.locator('.stat-box').first().locator('p.font-mono');
    await expect(balance).toBeVisible();
  });

  test('should display Surge Bucks balance', async ({ page }) => {
    await expect(page.locator('text=Surge Bucks')).toBeVisible();
  });

  test('should display streak count', async ({ page }) => {
    await expect(page.locator('text=Day Streak')).toBeVisible();
  });

  test('should navigate to Image Studio', async ({ page }) => {
    await page.locator('text=Image Studio').first().click();
    await page.waitForURL('**/image-studio');
    await expect(page.locator('text=Image Studio')).toBeVisible();
  });

  test('should navigate to Video Engine', async ({ page }) => {
    await page.locator('text=Video Engine').first().click();
    await page.waitForURL('**/video-engine');
    await expect(page.locator('text=Video Engine')).toBeVisible();
  });

  test('should display daily rewards section', async ({ page }) => {
    await expect(page.locator('text=Daily Rewards')).toBeVisible();
  });
});
