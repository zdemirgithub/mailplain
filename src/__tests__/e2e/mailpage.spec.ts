import { test, expect } from '@playwright/test';

test.describe('MailPage (auth/mail/page.tsx)', () => {
  test('renders user controls and lazy loads MailPage', async ({ page }) => {
    await page.goto('/mail'); // Adjust route if different

    // Check for UserButton (looks for element with aria-label from Clerk)
    await expect(page.locator('button[aria-label="User menu"]')).toBeVisible();

    // Check for ModeToggle button
    await expect(page.locator('button:has-text("Toggle theme")')).toBeVisible();

    // Check for ComposeButton (assuming it has text "Compose" or button with aria-label "Compose")
    await expect(page.locator('button:has-text("Compose")')).toBeVisible();

    // Check if WebhookDebugger renders only in development
    if (process.env.NODE_ENV === 'development') {
      await expect(page.locator('text=Webhook Debugger')).toBeVisible();
    } else {
      await expect(page.locator('text=Webhook Debugger')).toHaveCount(0);
    }

    // Check lazy loading fallback text "Loading..."
    // Because MailPage is dynamic with SSR disabled
    await expect(page.locator('text=Loading...')).toBeVisible();

    // Wait for MailPage to load
    await page.waitForSelector('text=Inbox', { timeout: 5000 }).catch(() => {
      // fallback if Inbox text isn't available, adapt to your MailPage content
    });
  });
});
