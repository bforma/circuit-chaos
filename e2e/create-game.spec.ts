import { test, expect } from '@playwright/test';

test.describe('Create Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create Game' }).click();
  });

  test('creates a game and shows lobby', async ({ page }) => {
    await page.getByPlaceholder('Your name').fill('TestPlayer');
    await page.getByRole('button', { name: 'Create' }).click();

    // Should navigate to lobby
    await expect(page.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });

    // Should show game code
    await expect(page.getByText('Code:')).toBeVisible();

    // Should show player in list
    await expect(page.getByText('TestPlayer')).toBeVisible();
    await expect(page.getByText('(Host)')).toBeVisible();
    await expect(page.getByText('(You)')).toBeVisible();
  });

  test('shows player count in lobby', async ({ page }) => {
    await page.getByPlaceholder('Your name').fill('Host');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Players (1/')).toBeVisible({ timeout: 5000 });
  });

  test('shows start button for host', async ({ page }) => {
    await page.getByPlaceholder('Your name').fill('Host');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Need at least 2 players')).toBeVisible({ timeout: 5000 });
  });

  test('shows leave button in lobby', async ({ page }) => {
    await page.getByPlaceholder('Your name').fill('Host');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByRole('button', { name: 'Leave Game' })).toBeVisible({ timeout: 5000 });
  });

  test('game code is 4 characters', async ({ page }) => {
    await page.getByPlaceholder('Your name').fill('Host');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });

    // Verify game code is displayed and has 4 characters
    const codeElement = page.locator('text=Code:').locator('xpath=..').locator('span');
    const gameCode = await codeElement.textContent();

    expect(gameCode).toBeTruthy();
    expect(gameCode).toHaveLength(4);
  });
});
