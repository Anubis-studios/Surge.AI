import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard');
}

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should have sidebar navigation', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Image Studio')).toBeVisible();
    await expect(page.locator('text=Video Engine')).toBeVisible();
    await expect(page.locator('text=Billing')).toBeVisible();
    await expect(page.locator('text=Rewards')).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    // Start at dashboard
    await expect(page).toHaveURL(/dashboard/);

    // Navigate to Image Studio
    await page.locator('nav >> text=Image Studio').click();
    await expect(page).toHaveURL(/image-studio/);

    // Navigate to Video Engine
    await page.locator('nav >> text=Video Engine').click();
    await expect(page).toHaveURL(/video-engine/);

    // Navigate to Billing
    await page.locator('nav >> text=Billing').click();
    await expect(page).toHaveURL(/billing/);

    // Navigate to Rewards
    await page.locator('nav >> text=Rewards').click();
    await expect(page).toHaveURL(/rewards/);

    // Navigate back to Dashboard
    await page.locator('nav >> text=Dashboard').click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should display Surge.AI branding in sidebar', async ({ page }) => {
    await expect(page.locator('text=Surge.AI').first()).toBeVisible();
  });

  test('should display user info in sidebar', async ({ page }) => {
    await expect(page.locator('text=Alex Creator')).toBeVisible();
    await expect(page.locator('text=creator@surge.ai')).toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should show mobile menu button
    const menuButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await expect(menuButton).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });
});
