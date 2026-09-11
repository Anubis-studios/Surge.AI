import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard');
}

test.describe('Video Engine', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/video-engine');
  });

  test('should display Video Engine page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Video Engine');
    await expect(page.locator('text=Premium AI video generation')).toBeVisible();
  });

  test('should display buck balance', async ({ page }) => {
    await expect(page.locator('text=bucks')).toBeVisible();
  });

  test('should have prompt textarea', async ({ page }) => {
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder', /describe the video/i);
  });

  test('should display storyboard section', async ({ page }) => {
    await expect(page.locator('text=Storyboard')).toBeVisible();
    await expect(page.locator('text=+ Add Scene')).toBeVisible();
  });

  test('should add new scene', async ({ page }) => {
    await page.locator('text=+ Add Scene').click();
    // Should now have 2 scene inputs
    const sceneInputs = page.locator('input[placeholder*="Scene"]');
    await expect(sceneInputs).toHaveCount(2);
  });

  test('should disable generate button when prompt is empty', async ({ page }) => {
    const button = page.locator('button', { hasText: /generate video/i });
    await expect(button).toBeDisabled();
  });

  test('should enable generate button when prompt is entered', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('A cinematic sunset over the ocean');
    
    const button = page.locator('button', { hasText: /generate video/i });
    await expect(button).toBeEnabled();
  });

  test('should show engine info panel', async ({ page }) => {
    await expect(page.locator('text=Surge.AI Video Engine')).toBeVisible();
  });

  test('should show empty state when no videos', async ({ page }) => {
    await expect(page.locator('text=No videos yet')).toBeVisible();
  });
});
