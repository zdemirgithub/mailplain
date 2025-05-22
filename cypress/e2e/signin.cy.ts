import { test, expect } from '@playwright/test';

test.describe('Sign In Page', () => {
  test('renders sign-in component and allows user to interact', async ({ page }) => {
    await page.goto('/sign-in');

    // Check that the SignIn component renders by looking for form elements
    await expect(page.locator('form')).toBeVisible();

    // Check for email/username input
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Check for password input
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(passwordInput).toBeVisible();

    // Check for sign-in button
    const signInButton = page.locator('button[type="submit"]');
    await expect(signInButton).toBeVisible();

    // (Optional) Try to fill the form and submit, but this might require mocking Clerk's backend or
    // a test account in Clerk for a full flow.

    // Example: Just fill inputs and ensure they accept values
    await emailInput.fill('testuser@example.com');
    await passwordInput.fill('testpassword');

    // You can check button is enabled
    await expect(signInButton).toBeEnabled();
  });
});
