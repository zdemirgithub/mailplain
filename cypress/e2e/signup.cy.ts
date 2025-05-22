import { test, expect } from '@playwright/test';

test.describe('Sign Up Page', () => {
  test('renders sign-up component and shows expected inputs', async ({ page }) => {
    await page.goto('/sign-up');

    // The sign-up form should be visible
    await expect(page.locator('form')).toBeVisible();

    // Check for email input field
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Check for password input field
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(passwordInput).toBeVisible();

    // Check for sign-up button
    const signUpButton = page.locator('button[type="submit"]');
    await expect(signUpButton).toBeVisible();

    // Optionally, test filling the inputs (won't actually sign up without Clerk backend)
    await emailInput.fill('newuser@example.com');
    await passwordInput.fill('TestPassword123!');

    await expect(signUpButton).toBeEnabled();
  });
});
