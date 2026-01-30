import { test, expect } from '@playwright/test';

test.describe('Join Game', () => {
  test('shows error for invalid game code', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Join Game' }).click();

    await page.getByPlaceholder('Your name').fill('Player2');
    await page.getByPlaceholder('Game code').fill('XXXX');
    await page.getByRole('button', { name: 'Join' }).click();

    // Should show error alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('not found');
      await dialog.accept();
    });
  });

  test('converts game code to uppercase', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Join Game' }).click();

    const codeInput = page.getByPlaceholder('Game code');
    await codeInput.fill('abcd');

    await expect(codeInput).toHaveValue('ABCD');
  });
});
