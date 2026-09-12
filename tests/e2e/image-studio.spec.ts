import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard');
}

test.describe('Image Studio', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/image-studio');
  });

  test('should display Image Studio page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Image Studio');
    await expect(page.locator('text=Premium AI image generation')).toBeVisible();
  });

  test('should display coin balance', async ({ page }) => {
    await expect(page.locator('text=coins')).toBeVisible();
  });

  test('should have prompt textarea', async ({ page }) => {
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder', /describe the image/i);
  });

  test('should display style presets', async ({ page }) => {
    await expect(page.locator('text=Photorealistic')).toBeVisible();
    await expect(page.locator('text=Anime')).toBeVisible();
    await expect(page.locator('text=Cyberpunk')).toBeVisible();
  });

  test('should display aspect ratio options', async ({ page }) => {
    await expect(page.locator('text=1:1')).toBeVisible();
    await expect(page.locator('text=16:9')).toBeVisible();
  });

  test('should disable generate button when prompt is empty', async ({ page }) => {
    const button = page.locator('button', { hasText: /generate image/i });
    await expect(button).toBeDisabled();
  });

  test('should enable generate button when prompt is entered', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('A beautiful sunset over the ocean');
    
    const button = page.locator('button', { hasText: /generate image/i });
    await expect(button).toBeEnabled();
  });

  test('should select a style preset', async ({ page }) => {
    await page.locator('text=Anime').click();
    // Should have active styling
    const animeButton = page.locator('button', { hasText: 'Anime' });
    await expect(animeButton).toHaveClass(/gold-400/);
  });

  test('should show empty state when no images', async ({ page }) => {
    await expect(page.locator('text=No images yet')).toBeVisible();
  });
});
