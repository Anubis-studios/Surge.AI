import { test, expect } from '@playwright/test';

async function login(page: any) {
  await page.goto('/');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/dashboard');
}

test.describe('Billing', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/billing');
  });

  test('should display Billing page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Billing');
  });

  test('should display current coin balance', async ({ page }) => {
    await expect(page.locator('text=Surge Coins').first()).toBeVisible();
  });

  test('should display current buck balance', async ({ page }) => {
    await expect(page.locator('text=Surge Bucks').first()).toBeVisible();
  });

  test('should display all coin bundles', async ({ page }) => {
    await expect(page.locator('text=Starter Pack')).toBeVisible();
    await expect(page.locator('text=Creator Pack')).toBeVisible();
    await expect(page.locator('text=Pro Pack')).toBeVisible();
    await expect(page.locator('text=Ultra Pack')).toBeVisible();
  });

  test('should display all buck bundles', async ({ page }) => {
    await expect(page.locator('text=Small').first()).toBeVisible();
    await expect(page.locator('text=Medium').first()).toBeVisible();
    await expect(page.locator('text=Large').first()).toBeVisible();
  });

  test('should display coin prices', async ({ page }) => {
    await expect(page.locator('text=£3')).toBeVisible();
    await expect(page.locator('text=£7')).toBeVisible();
    await expect(page.locator('text=£15')).toBeVisible();
    await expect(page.locator('text=£30')).toBeVisible();
  });

  test('should display buck prices', async ({ page }) => {
    await expect(page.locator('text=£10')).toBeVisible();
    await expect(page.locator('text=£25')).toBeVisible();
    await expect(page.locator('text=£50')).toBeVisible();
  });

  test('should show popular badge on creator pack', async ({ page }) => {
    await expect(page.locator('text=POPULAR')).toBeVisible();
  });

  test('should show best value badge on medium buck bundle', async ({ page }) => {
    await expect(page.locator('text=BEST VALUE')).toBeVisible();
  });

  test('should have purchase buttons', async ({ page }) => {
    const purchaseButtons = page.locator('button', { hasText: 'Purchase' });
    await expect(purchaseButtons).toHaveCount(7); // 4 coins + 3 bucks
  });
});
