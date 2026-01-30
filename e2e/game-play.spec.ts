import { test, expect } from '@playwright/test';

test.describe('Game Play', () => {
  test('shows programming panel with cards after game starts', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    // Setup: create and join game
    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    await hostPage.getByPlaceholder('Your name').fill('Host');
    await hostPage.getByRole('button', { name: 'Create' }).click();

    await expect(hostPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    const codeElement = hostPage.locator('text=Code:').locator('xpath=..').locator('span');
    const gameCode = await codeElement.textContent();

    await guestPage.goto('/');
    await guestPage.getByRole('button', { name: 'Join Game' }).click();
    await guestPage.getByPlaceholder('Your name').fill('Guest');
    await guestPage.getByPlaceholder('Game code').fill(gameCode!);
    await guestPage.getByRole('button', { name: 'Join' }).click();

    await expect(guestPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });

    // Start game
    await hostPage.getByRole('button', { name: 'Start Game' }).click();

    // Should see programming interface
    await expect(hostPage.getByText('Program Your Robot')).toBeVisible({ timeout: 5000 });
    await expect(hostPage.getByText('Your Cards')).toBeVisible();
    await expect(hostPage.getByText('Registers', { exact: true })).toBeVisible();

    // Should see submit button (disabled initially)
    await expect(hostPage.getByRole('button', { name: 'Fill all registers' })).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });

  test('shows player HUD with damage and lives', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    // Setup game
    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    await hostPage.getByPlaceholder('Your name').fill('Host');
    await hostPage.getByRole('button', { name: 'Create' }).click();

    await expect(hostPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    const codeElement = hostPage.locator('text=Code:').locator('xpath=..').locator('span');
    const gameCode = await codeElement.textContent();

    await guestPage.goto('/');
    await guestPage.getByRole('button', { name: 'Join Game' }).click();
    await guestPage.getByPlaceholder('Your name').fill('Guest');
    await guestPage.getByPlaceholder('Game code').fill(gameCode!);
    await guestPage.getByRole('button', { name: 'Join' }).click();

    await expect(guestPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    await hostPage.getByRole('button', { name: 'Start Game' }).click();

    // Check HUD elements
    await expect(hostPage.getByText('Damage')).toBeVisible({ timeout: 5000 });
    await expect(hostPage.getByText('Lives')).toBeVisible();
    await expect(hostPage.getByText('Checkpoint')).toBeVisible();
    await expect(hostPage.getByText('Direction')).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });

  test('shows player list with all players during game', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    // Setup game
    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    await hostPage.getByPlaceholder('Your name').fill('Alice');
    await hostPage.getByRole('button', { name: 'Create' }).click();

    await expect(hostPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    const codeElement = hostPage.locator('text=Code:').locator('xpath=..').locator('span');
    const gameCode = await codeElement.textContent();

    await guestPage.goto('/');
    await guestPage.getByRole('button', { name: 'Join Game' }).click();
    await guestPage.getByPlaceholder('Your name').fill('Bob');
    await guestPage.getByPlaceholder('Game code').fill(gameCode!);
    await guestPage.getByRole('button', { name: 'Join' }).click();

    await expect(guestPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    await hostPage.getByRole('button', { name: 'Start Game' }).click();

    await expect(hostPage.getByText('Program Your Robot')).toBeVisible({ timeout: 5000 });

    // Host should see player list heading and both player names
    await expect(hostPage.getByRole('heading', { name: 'Players' })).toBeVisible();
    // Check names appear (they show in player list)
    await expect(hostPage.getByText('Alice').first()).toBeVisible();
    await expect(hostPage.getByText('Bob').first()).toBeVisible();

    // Guest should also see both players
    await expect(guestPage.getByRole('heading', { name: 'Players' })).toBeVisible();
    await expect(guestPage.getByText('Alice').first()).toBeVisible();
    await expect(guestPage.getByText('Bob').first()).toBeVisible();

    await hostContext.close();
    await guestContext.close();
  });

  test('can select and place cards in registers', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const guestContext = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const guestPage = await guestContext.newPage();

    // Setup game
    await hostPage.goto('/');
    await hostPage.getByRole('button', { name: 'Create Game' }).click();
    await hostPage.getByPlaceholder('Your name').fill('Host');
    await hostPage.getByRole('button', { name: 'Create' }).click();

    await expect(hostPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    const codeElement = hostPage.locator('text=Code:').locator('xpath=..').locator('span');
    const gameCode = await codeElement.textContent();

    await guestPage.goto('/');
    await guestPage.getByRole('button', { name: 'Join Game' }).click();
    await guestPage.getByPlaceholder('Your name').fill('Guest');
    await guestPage.getByPlaceholder('Game code').fill(gameCode!);
    await guestPage.getByRole('button', { name: 'Join' }).click();

    await expect(guestPage.getByText('Game Lobby')).toBeVisible({ timeout: 5000 });
    await hostPage.getByRole('button', { name: 'Start Game' }).click();

    await expect(hostPage.getByText('Program Your Robot')).toBeVisible({ timeout: 5000 });

    // Find and click a card in hand (cards in the "cards" grid)
    const cardsContainer = hostPage.locator('[class*="cards"]');
    const firstCard = cardsContainer.locator('[class*="card"]').first();
    await firstCard.click();

    // Click first register slot (inside registerSlots, not the label)
    const registerSlots = hostPage.locator('[class*="registerSlots"]');
    const register1 = registerSlots.locator('[class*="register"]').first();
    await register1.click();

    // Wait a moment for state update
    await hostPage.waitForTimeout(500);

    // The register should now be filled (has the 'filled' class)
    await expect(register1).toHaveClass(/filled/);

    await hostContext.close();
    await guestContext.close();
  });
});
