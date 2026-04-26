import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the welcome heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
  });

  test('should display the subtitle text', async ({ page }) => {
    await expect(
      page.getByText('Get started by editing your pages'),
    ).toBeVisible();
  });

  test('should have a theme toggle button', async ({ page }) => {
    const themeToggle = page.getByRole('button');
    await expect(themeToggle).toBeVisible();
  });

  test('should display the project card', async ({ page }) => {
    await expect(
      page.getByText('This project was scaffolded with react-cli'),
    ).toBeVisible();
  });

  test('should toggle theme via dropdown', async ({ page }) => {
    // Open theme dropdown
    const themeButton = page.getByRole('button');
    await themeButton.click();

    // Select dark theme
    await page.getByRole('menuitem', { name: 'Dark' }).click();

    // Verify dark class is applied
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });
});
