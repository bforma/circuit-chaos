import { test, expect } from '@playwright/test';

test.describe('Reconnect', () => {
  test('player reconnects to game after page refresh', async ({ page }) => {
    // Create a game
    await page.goto('/');
    await page.getByRole('button', { name: 'Create Game' }).click();
    await page.getByPlaceholder('Your name').fill('ReconnectTest');
    await page.getByRole('button', { name: 'Create' }).click();

    // Wait for lobby
    await expect(page.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });

    // Get the game code
    const codeElement = page.locator('text=Code:').locator('xpath=..').locator('span');
    const gameCode = await codeElement.textContent();
    expect(gameCode).toBeTruthy();

    // Refresh the page
    await page.reload();

    // Should automatically reconnect and show lobby again
    await expect(page.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('ReconnectTest')).toBeVisible();

    // Game code should be the same
    const newCodeElement = page.locator('text=Code:').locator('xpath=..').locator('span');
    const newGameCode = await newCodeElement.textContent();
    expect(newGameCode).toBe(gameCode);
  });

  test('session is cleared after leaving game', async ({ page }) => {
    // Create a game
    await page.goto('/');
    await page.getByRole('button', { name: 'Create Game' }).click();
    await page.getByPlaceholder('Your name').fill('LeaveTest');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });

    // Leave the game
    await page.getByRole('button', { name: 'Leave Game' }).click();

    // Should be back at menu
    await expect(page.getByRole('button', { name: 'Create Game' })).toBeVisible({ timeout: 5000 });

    // Refresh the page
    await page.reload();

    // Should still be at menu (not reconnecting to old game)
    await expect(page.getByRole('button', { name: 'Create Game' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Game Lobby')).not.toBeVisible();
  });

  test('multiplayer reconnect preserves game state', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    // Host creates game
    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    await hostPage.getByPlaceholder('Your name').fill('Host');
    await hostPage.getByRole('button', { name: 'Create' }).click();

    await expect(hostPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    const codeElement = hostPage.locator('text=Code:').locator('xpath=..').locator('span');
    const gameCode = await codeElement.textContent();

    // Guest joins
    await guestPage.goto('/');
    await guestPage.getByRole('button', { name: 'Join Game' }).click();
    await guestPage.getByPlaceholder('Your name').fill('Guest');
    await guestPage.getByPlaceholder('Game code').fill(gameCode!);
    await guestPage.getByRole('button', { name: 'Join' }).click();

    await expect(guestPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    await expect(hostPage.getByText('Players (2/')).toBeVisible();

    // Host refreshes
    await hostPage.reload();

    // Host should reconnect and still see both players
    await expect(hostPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    await expect(hostPage.getByText('Host')).toBeVisible();
    await expect(hostPage.getByText('Guest')).toBeVisible();
    await expect(hostPage.getByText('Players (2/')).toBeVisible();

    // Guest should still see host as connected (not showing disconnected)
    await expect(guestPage.getByText('Host (Host)')).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });
});
