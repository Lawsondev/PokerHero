// tests/equity.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Equity Calculator (root "/")', () => {
  test.beforeEach(async ({ page }) => {
    // this will automatically start your app at http://localhost:3000
    await page.goto('/');
  });

  test('has the correct page title', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText(
      'Interactive Poker Equity Tool'
    );
  });

  test('can calculate a simple equity', async ({ page }) => {
    // fill in hero and opponent
    await page.fill('input[placeholder="Ah Kh"]', 'Ah Kh');
    await page.fill('input[placeholder="Qs Jh"]', 'Qs Jh');
    // board empty is valid
    await page.click('button:has-text("Calculate Equity")');
    // wait for result to appear
    const equityText = await page.locator("text=Hero's Equity");
    await expect(equityText).toContainText('%');
  });
});
