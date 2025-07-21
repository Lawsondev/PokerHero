import { test, expect } from '@playwright/test';

test.describe('PokerHero App', () => {
  test('loads home page and shows title', async ({ page }) => {
    // Navigate to /
    await page.goto('/');
    // Wait for the heading
    const header = page.locator('h1');
    await expect(header).toHaveText('Interactive Poker Equity Tool');
  });

  test('Calculate Equity button is disabled until inputs valid', async ({
    page,
  }) => {
    await page.goto('/equity');
    // Locate the button
    const calcBtn = page.getByRole('button', { name: /Calculate Equity/i });
    await expect(calcBtn).toBeDisabled();

    // Fill valid hero & villain hands
    await page.getByLabel("Hero's Hand").fill('Ah Kh');
    await page.getByLabel("Opponent's Hand").fill('Qs Jh');
    // Now button should enable
    await expect(calcBtn).toBeEnabled();
  });
});
