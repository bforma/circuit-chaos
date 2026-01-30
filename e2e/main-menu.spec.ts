import { test, expect } from '@playwright/test';

test.describe('Main Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays game title and subtitle', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Circuit Chaos' })).toBeVisible();
    await expect(page.getByText('Program your robot')).toBeVisible();
  });

  test('shows create and join buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Create Game' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join Game' })).toBeVisible();
  });

  test('shows name input when clicking Create Game', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Game' }).click();

    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  });

  test('shows name and code inputs when clicking Join Game', async ({ page }) => {
    await page.getByRole('button', { name: 'Join Game' }).click();

    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByPlaceholder('Game code')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Back' })).toBeVisible();
  });

  test('back button returns to main menu', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Game' }).click();
    await page.getByRole('button', { name: 'Back' }).click();

    await expect(page.getByRole('button', { name: 'Create Game' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join Game' })).toBeVisible();
  });

  test('shows error for empty name when creating game', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Game' }).click();
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Please enter your name')).toBeVisible();
  });

  test('shows error for name too short when creating game', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Game' }).click();
    await page.getByPlaceholder('Your name').fill('A');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Name must be at least 2 characters')).toBeVisible();
  });

  test('shows error for name with only special characters', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Game' }).click();
    await page.getByPlaceholder('Your name').fill('!!!');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Name must contain at least one letter or number')).toBeVisible();
  });

  test('clears error when typing in name field', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Game' }).click();
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page.getByText('Please enter your name')).toBeVisible();

    await page.getByPlaceholder('Your name').fill('T');

    await expect(page.getByText('Please enter your name')).not.toBeVisible();
  });

  test('shows error for empty game code when joining', async ({ page }) => {
    await page.getByRole('button', { name: 'Join Game' }).click();
    await page.getByPlaceholder('Your name').fill('TestPlayer');
    await page.getByRole('button', { name: 'Join' }).click();

    await expect(page.getByText('Please enter a game code')).toBeVisible();
  });
});
