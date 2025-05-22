import { test, expect } from '@playwright/test';

// Mocking the getSubscriptionStatus function
test.beforeEach(({ page }) => {
  page.route('**/api/trpc/mail.getChatbotInteraction', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        result: {
          data: {
            remainingCredits: 3,
          },
        },
      }),
    });
  });
});

test('displays Premium Plan when subscribed', async ({ page }) => {
  // Mock window.getSubscriptionStatus to return true (subscribed)
  await page.addInitScript(() => {
    window.getSubscriptionStatus = async () => true;
  });

  await page.setContent(`
    <div id="root"></div>
    <script type="module">
      import React from "https://cdn.skypack.dev/react";
      import ReactDOM from "https://cdn.skypack.dev/react-dom";
      import PremiumBanner from "./path-to-your-premium-banner"; // adjust import path
      ReactDOM.render(React.createElement(PremiumBanner), document.getElementById('root'));
    </script>
  `);

  // Wait for PremiumPlan text to appear
  await expect(page.locator('text=Premium Plan')).toBeVisible();

  // Confirm StripeButton is present
  await expect(page.locator('text=StripeButton')).toBeVisible();

  // Check that Basic Plan text is not visible
  await expect(page.locator('text=Basic Plan')).toHaveCount(0);
});

test('displays Basic Plan with remaining credits when not subscribed', async ({ page }) => {
  // Mock window.getSubscriptionStatus to return false (not subscribed)
  await page.addInitScript(() => {
    window.getSubscriptionStatus = async () => false;
  });

  await page.setContent(`
    <div id="root"></div>
    <script type="module">
      import React from "https://cdn.skypack.dev/react";
      import ReactDOM from "https://cdn.skypack.dev/react-dom";
      import PremiumBanner from "./path-to-your-premium-banner"; // adjust import path
      ReactDOM.render(React.createElement(PremiumBanner), document.getElementById('root'));
    </script>
  `);

  await expect(page.locator('text=Basic Plan')).toBeVisible();
  await expect(page.locator('text=3 /')).toBeVisible(); // remaining credits

  // Confirm StripeButton is present
  await expect(page.locator('text=StripeButton')).toBeVisible();

  // Check that Premium Plan text is not visible
  await expect(page.locator('text=Premium Plan')).toHaveCount(0);
});
