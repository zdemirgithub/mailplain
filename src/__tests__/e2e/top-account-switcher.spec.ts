import { test, expect } from '@playwright/test';

test.describe('TopAccountSwitcher component', () => {
  test('renders accounts with emails and keyboard shortcuts', async ({ page }) => {
    // Mock the API or setup the environment so that `useThreads` returns accounts
    // For example, if you have an API that provides accounts,
    // you could mock its response here.
    // This example assumes you have a route /api/accounts that returns the account list
    await page.route('/api/accounts', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accounts: [
            { emailAddress: 'user1@example.com' },
            { emailAddress: 'user2@example.com' },
            { emailAddress: 'user3@example.com' },
          ],
        }),
      })
    );

    // Navigate to the page where TopAccountSwitcher is used
    // Replace `/mail` with the actual page route where it is rendered
    await page.goto('/mail');

    // Check if the emails are visible
    for (let i = 1; i <= 3; i++) {
      await expect(page.locator(`text=user${i}@example.com`)).toBeVisible();
      // Check if the keyboard shortcut is visible (⌘ + index)
      await expect(page.locator(`text=⌘ + ${i}`)).toBeVisible();
    }
  });
});
