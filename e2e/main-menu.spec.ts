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
});
