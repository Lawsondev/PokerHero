// tests/poker-hero.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Poker Hero App', () => {
  test.beforeEach(async ({ page }) => {
    // adjust if your dev server runs on a different port
    await page.goto('http://localhost:3000/');
  });

  test('home page loads and shows equity tool title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Interactive Poker Equity Tool/i })).toBeVisible();
  });

  test('can generate and display a random villain hand', async ({ page }) => {
    // click “Generate Random Villain Hand”
    await page.getByRole('button', { name: /Generate Random Villain Hand/i }).click();
    // should populate the Opponent input
    const oppInput = page.getByLabel(/Opponent's Hand/i);
    await expect(oppInput).not.toHaveValue('');
    // and display two card images
    await expect(page.locator('img[alt]').first()).toBeVisible();
  });

  test('calculate equity button is disabled until valid inputs', async ({ page }) => {
    const calc = page.getByRole('button', { name: /Calculate Equity/i });
    await expect(calc).toBeDisabled();
    // enter two valid hands
    await page.getByLabel(/Hero's Hand/i).fill('Ah Kh');
    await page.getByLabel(/Opponent's Hand/i).fill('Qs Jh');
    await expect(calc).toBeEnabled();
  });
});
