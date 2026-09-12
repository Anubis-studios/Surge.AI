import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard');
}

test.describe('End-to-End User Flows', () => {
  test('complete image generation flow', async ({ page }) => {
    await login(page);
    
    // Navigate to Image Studio
    await page.goto('/image-studio');
    
    // Enter prompt
    const textarea = page.locator('textarea');
    await textarea.fill('A majestic lion in a golden savanna at sunset');
    
    // Select style
    await page.locator('text=Photorealistic').click();
    
    // Select aspect ratio
    await page.locator('text=16:9').click();
    
    // Generate button should be enabled
    const generateButton = page.locator('button', { hasText: /generate image/i });
    await expect(generateButton).toBeEnabled();
    
    // Note: In real backend, this would call the API
    // For now, we just verify the UI is ready
  });

  test('complete video generation flow', async ({ page }) => {
    await login(page);
    
    // Navigate to Video Engine
    await page.goto('/video-engine');
    
    // Enter prompt
    const textarea = page.locator('textarea');
    await textarea.fill('A drone shot flying over mountains at dawn');
    
    // Add storyboard scenes
    await page.locator('text=+ Add Scene').click();
    const sceneInputs = page.locator('input[placeholder*="Scene"]');
    await sceneInputs.first().fill('Wide shot of mountain range');
    await sceneInputs.nth(1).fill('Close-up of eagle soaring');
    
    // Generate button should be enabled
    const generateButton = page.locator('button', { hasText: /generate video/i });
    await expect(generateButton).toBeEnabled();
  });

  test('complete billing flow', async ({ page }) => {
    await login(page);
    
    // Navigate to Billing
    await page.goto('/billing');
    
    // Verify balances are shown
    await expect(page.locator('text=Surge Coins').first()).toBeVisible();
    await expect(page.locator('text=Surge Bucks').first()).toBeVisible();
    
    // Find and verify purchase buttons exist
    const purchaseButtons = page.locator('button', { hasText: 'Purchase' });
    await expect(purchaseButtons).toHaveCount(7);
    
    // Note: In real backend, clicking would redirect to Stripe
  });

  test('complete rewards flow', async ({ page }) => {
    await login(page);
    
    // Navigate to Rewards
    await page.goto('/rewards');
    
    // Verify streak info is shown
    await expect(page.locator('text=Current Streak')).toBeVisible();
    
    // Verify claim button exists
    const claimButton = page.locator('button', { hasText: /claim today/i });
    await expect(claimButton).toBeVisible();
    
    // Try to claim reward (if not already claimed)
    if (await claimButton.isEnabled()) {
      await claimButton.click();
      // Wait for potential notification
      await page.waitForTimeout(500);
    }
  });

  test('navigate through all pages', async ({ page }) => {
    await login(page);
    
    const pages = [
      { name: 'Dashboard', url: /dashboard/ },
      { name: 'Image Studio', url: /image-studio/ },
      { name: 'Video Engine', url: /video-engine/ },
      { name: 'Billing', url: /billing/ },
      { name: 'Rewards', url: /rewards/ },
    ];

    for (const pageData of pages) {
      await page.locator(`nav >> text=${pageData.name}`).click();
      await expect(page).toHaveURL(pageData.url);
    }
  });
});
