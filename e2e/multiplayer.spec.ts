import { test, expect } from '@playwright/test';

test.describe('Multiplayer', () => {
  test('two players can join same game', async ({ browser }) => {
    // Create two browser contexts (like two different users)
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    // Host creates a game
    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    await hostPage.getByPlaceholder('Your name').fill('HostPlayer');
    await hostPage.getByRole('button', { name: 'Create' }).click();

    // Wait for lobby and get game code
    await expect(hostPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    const codeElement = hostPage.locator('text=Code:').locator('xpath=..').locator('span');
    const gameCode = await codeElement.textContent();

    expect(gameCode).toBeTruthy();
    expect(gameCode).toHaveLength(4);

    // Guest joins the game
    await guestPage.goto('/');
    await guestPage.getByRole('button', { name: 'Join Game' }).click();
    await guestPage.getByPlaceholder('Your name').fill('GuestPlayer');
    await guestPage.getByPlaceholder('Game code').fill(gameCode!);
    await guestPage.getByRole('button', { name: 'Join' }).click();

    // Both should see each other in lobby
    await expect(guestPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    await expect(guestPage.getByText('HostPlayer')).toBeVisible();
    await expect(guestPage.getByText('GuestPlayer')).toBeVisible();

    // Host should also see the guest
    await expect(hostPage.getByText('GuestPlayer')).toBeVisible();
    await expect(hostPage.getByText('Players (2/')).toBeVisible();

    // Clean up
    await hostContext.close();
    await guestContext.close();
  });

  test('host can start game with 2 players', async ({ browser }) => {
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

    // Host starts the game
    await expect(hostPage.getByRole('button', { name: 'Start Game' })).toBeEnabled();
    await hostPage.getByRole('button', { name: 'Start Game' }).click();

    // Both players should see the game board
    await expect(hostPage.getByText('Program Your Robot')).toBeVisible({ timeout: 5000 });
    await expect(guestPage.getByText('Program Your Robot')).toBeVisible({ timeout: 5000 });

    await hostContext.close();
    await guestContext.close();
  });

  test('guest sees waiting message instead of start button', async ({ browser }) => {
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

    // Guest should see waiting message, not start button
    await expect(guestPage.getByText('Waiting for host to start')).toBeVisible();
    await expect(guestPage.getByRole('button', { name: 'Start Game' })).not.toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });

  test('host can leave game with guest present', async ({ browser }) => {
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

    // Host leaves the game
    await hostPage.getByRole('button', { name: 'Leave Game' }).click();

    // Host should return to main menu
    await expect(hostPage.getByRole('button', { name: 'Create Game' })).toBeVisible({ timeout: 5000 });

    // Guest should become the new host
    await expect(guestPage.getByText('Guest (Host)')).toBeVisible({ timeout: 5000 });

    await hostContext.close();
    await guestContext.close();
  });
});
