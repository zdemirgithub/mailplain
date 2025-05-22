import { test, expect } from '@playwright/test';

test.describe('StripeButton component', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock functions into the window context
    await page.addInitScript(() => {
      window.getSubscriptionStatus = async () => false;
      window.createCheckoutSession = async () => window.__checkoutCalled = true;
      window.createBillingPortalSession = async () => window.__portalCalled = true;
    });

    // Inject component HTML and mock implementation
    await page.setContent(`
      <div id="root"></div>
      <script type="module">
        import React, { useEffect, useState } from "https://cdn.skypack.dev/react";
        import ReactDOM from "https://cdn.skypack.dev/react-dom";
        
        const StripeButton = () => {
          const [isSubscribed, setIsSubscribed] = useState(false);
          useEffect(() => {
            (async () => {
              const subscribed = await window.getSubscriptionStatus();
              setIsSubscribed(subscribed);
            })();
          }, []);
          
          const handleClick = async () => {
            if (!isSubscribed) {
              await window.createCheckoutSession();
            } else {
              await window.createBillingPortalSession();
            }
          };

          return React.createElement('button', { onClick: handleClick, id: 'stripe-btn' }, isSubscribed ? 'Manage Subscription' : 'Upgrade Plan');
        }

        ReactDOM.render(React.createElement(StripeButton), document.getElementById('root'));
      </script>
    `);
  });

  test('shows Upgrade Plan when not subscribed and calls createCheckoutSession', async ({ page }) => {
    const button = page.locator('#stripe-btn');
    await expect(button).toHaveText('Upgrade Plan');

    // Click the button and check if session was triggered
    await button.click();
    const checkoutCalled = await page.evaluate(() => window.__checkoutCalled);
    expect(checkoutCalled).toBeTruthy();
  });

  test('shows Manage Subscription when subscribed and calls createBillingPortalSession', async ({ page }) => {
    await page.evaluate(() => {
      window.getSubscriptionStatus = async () => true;
    });
    await page.reload();

    const button = page.locator('#stripe-btn');
    await expect(button).toHaveText('Manage Subscription');

    await button.click();
    const portalCalled = await page.evaluate(() => window.__portalCalled);
    expect(portalCalled).toBeTruthy();
  });
});
