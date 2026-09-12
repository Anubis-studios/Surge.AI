import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login page on first visit', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to login or show auth gate
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with demo credentials', async ({ page }) => {
    await page.goto('/');
    
    // Fill in email (pre-filled with demo)
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveValue('creator@surge.ai');
    
    // Click sign in
    await page.locator('button[type="submit"]').click();
    
    // Should navigate to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page.locator('text=Welcome back')).toBeVisible();
  });

  test('should show social login options', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.locator('text=Google')).toBeVisible();
    await expect(page.locator('text=GitHub')).toBeVisible();
  });
});
