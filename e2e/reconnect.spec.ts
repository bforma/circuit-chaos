import { test, expect } from '@playwright/test';

test.describe('Reconnect', () => {
  test('game ID is stored in URL hash', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Create Game' }).click();
    await page.getByPlaceholder('Your name').fill('UrlTest');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });

    // URL should contain game code in hash
    const url = page.url();
    expect(url).toMatch(/#[A-Z0-9]{4}$/);
  });

  test('opening URL with game ID shows join form', async ({ browser }) => {
    // First create a game to get a valid game code
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();

    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    await hostPage.getByPlaceholder('Your name').fill('Host');
    await hostPage.getByRole('button', { name: 'Create' }).click();

    await expect(hostPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    const hostUrl = hostPage.url();
    const gameCode = hostUrl.split('#')[1];

    // Open new context (simulates new user/tab) with game URL
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    await guestPage.goto(`/#${gameCode}`);

    // Should show join form with game code prefilled
    await expect(guestPage.getByText(`Enter your name to join game`)).toBeVisible({ timeout: 5000 });
    await expect(guestPage.getByText(gameCode)).toBeVisible();

    // Should be able to join
    await guestPage.getByPlaceholder('Your name').fill('Guest');
    await guestPage.getByRole('button', { name: 'Join' }).click();

    await expect(guestPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    await expect(guestPage.getByText('Guest')).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });

  test('two tabs can have different games', async ({ browser }) => {
    // Create first game in first tab
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await page1.goto('/');
    await page1.getByRole('button', { name: 'Create Game' }).click();
    await page1.getByPlaceholder('Your name').fill('Player1');
    await page1.getByRole('button', { name: 'Create' }).click();

    await expect(page1.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    const url1 = page1.url();
    const gameCode1 = url1.split('#')[1];

    // Create second game in second tab (new context)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await page2.goto('/');
    await page2.getByRole('button', { name: 'Create Game' }).click();
    await page2.getByPlaceholder('Your name').fill('Player2');
    await page2.getByRole('button', { name: 'Create' }).click();

    await expect(page2.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    const url2 = page2.url();
    const gameCode2 = url2.split('#')[1];

    // Game codes should be different
    expect(gameCode1).not.toBe(gameCode2);

    // Both should show their own game
    const code1Element = page1.locator('text=Code:').locator('xpath=..').locator('span');
    const code2Element = page2.locator('text=Code:').locator('xpath=..').locator('span');

    await expect(code1Element).toHaveText(gameCode1);
    await expect(code2Element).toHaveText(gameCode2);

    await context1.close();
    await context2.close();
  });

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

  test('host and guest can both refresh without swapping identities', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    // Host creates game
    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    await hostPage.getByPlaceholder('Your name').fill('HostPlayer');
    await hostPage.getByRole('button', { name: 'Create' }).click();

    await expect(hostPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    const hostUrl = hostPage.url();
    const gameCode = hostUrl.split('#')[1];

    // Guest joins via URL
    await guestPage.goto(`/#${gameCode}`);
    await guestPage.getByPlaceholder('Your name').fill('GuestPlayer');
    await guestPage.getByRole('button', { name: 'Join' }).click();

    await expect(guestPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });

    // Both should see 2 players
    await expect(hostPage.getByText('Players (2/')).toBeVisible();
    await expect(guestPage.getByText('Players (2/')).toBeVisible();

    // Host should still be host (not guest)
    await expect(hostPage.getByText('HostPlayer (Host) (You)')).toBeVisible();
    await expect(guestPage.getByText('GuestPlayer (You)')).toBeVisible();

    // Now refresh BOTH pages
    await hostPage.reload();
    await guestPage.reload();

    // Wait for reconnection
    await expect(hostPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    await expect(guestPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });

    // Host should STILL be host, not swapped with guest
    await expect(hostPage.getByText('HostPlayer (Host) (You)')).toBeVisible();
    await expect(guestPage.getByText('GuestPlayer (You)')).toBeVisible();

    // And they should still see each other
    await expect(hostPage.getByText('GuestPlayer')).toBeVisible();
    await expect(guestPage.getByText('HostPlayer')).toBeVisible();

    await hostContext.close();
    await guestContext.close();
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
    await expect(hostPage.getByText('Host (Host)')).toBeVisible();
    await expect(hostPage.getByText('Guest', { exact: true })).toBeVisible();
    await expect(hostPage.getByText('Players (2/')).toBeVisible();

    // Guest should still see host as connected (not showing disconnected)
    await expect(guestPage.getByText('Host (Host)')).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });

  test('shows error when joining game already in progress', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guest1Context = await browser.newContext();
    const guest2Context = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const guest1Page = await guest1Context.newPage();
    const guest2Page = await guest2Context.newPage();

    // Host creates game
    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    await hostPage.getByPlaceholder('Your name').fill('Host');
    await hostPage.getByRole('button', { name: 'Create' }).click();

    await expect(hostPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    const codeElement = hostPage.locator('text=Code:').locator('xpath=..').locator('span');
    const gameCode = await codeElement.textContent();

    // Guest1 joins
    await guest1Page.goto('/');
    await guest1Page.getByRole('button', { name: 'Join Game' }).click();
    await guest1Page.getByPlaceholder('Your name').fill('Guest1');
    await guest1Page.getByPlaceholder('Game code').fill(gameCode!);
    await guest1Page.getByRole('button', { name: 'Join' }).click();

    await expect(guest1Page.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    await expect(hostPage.getByText('Players (2/')).toBeVisible();

    // Host starts the game
    await hostPage.getByRole('button', { name: 'Start Game' }).click();

    // Wait for game to start (programming phase)
    await expect(hostPage.getByText('Program Your Robot')).toBeVisible({ timeout: 5000 });

    // Guest2 tries to join the already-started game
    await guest2Page.goto('/');
    await guest2Page.getByRole('button', { name: 'Join Game' }).click();
    await guest2Page.getByPlaceholder('Your name').fill('Guest2');
    await guest2Page.getByPlaceholder('Game code').fill(gameCode!);
    await guest2Page.getByRole('button', { name: 'Join' }).click();

    // Should see error message on screen
    await expect(guest2Page.getByText('Game already in progress')).toBeVisible({ timeout: 5000 });

    // Should still be on join form, not in lobby
    await expect(guest2Page.getByText('Game Lobby')).not.toBeVisible();

    await hostContext.close();
    await guest1Context.close();
    await guest2Context.close();
  });
});
