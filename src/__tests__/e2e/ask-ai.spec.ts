import { test, expect } from '@playwright/test';

test.describe('AskAI component', () => {
  test.beforeEach(async ({ page }) => {
    // Mock localStorage for accountId
    await page.addInitScript(() => {
      window.localStorage.setItem('accountId', 'test-account-123');
    });

    // Mock API for /api/chat for normal success response
    await page.route('**/api/chat', async (route, request) => {
      const postData = JSON.parse(request.postData() || '{}');
      if (postData.message === 'trigger limit') {
        // Simulate limit reached error
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Limit reached' } }),
        });
      } else {
        // Normal AI response
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'chat-1',
            choices: [
              { delta: { content: 'This is an AI response.' }, finish_reason: 'stop' }
            ],
          }),
        });
      }
    });
  });

  test('shows initial UI and sends a chat message', async ({ page }) => {
    // Mount the AskAI component (adapt this part to your app environment)
    await page.setContent(`
      <div id="root"></div>
      <script type="module">
        import React from "https://cdn.skypack.dev/react";
        import ReactDOM from "https://cdn.skypack.dev/react-dom";
        import AskAI from "./path-to-ask-ai"; // adjust import path
        ReactDOM.render(React.createElement(AskAI, { isCollapsed: false }), document.getElementById('root'));
      </script>
    `);

    // Check that the input placeholder is correct
    const input = page.locator('input[placeholder="Ask AI anything about your emails"]');
    await expect(input).toBeVisible();

    // Type a question
    await input.fill('Hello AI');

    // Submit the form
    await page.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

    // Wait for user message to appear in messages container
    await expect(page.locator('div:has-text("Hello AI")')).toBeVisible();

    // Wait for AI response to appear
    await expect(page.locator('div:has-text("This is an AI response.")')).toBeVisible();
  });

  test('shows toast error on limit reached', async ({ page }) => {
    await page.setContent(`
      <div id="root"></div>
      <script type="module">
        import React from "https://cdn.skypack.dev/react";
        import ReactDOM from "https://cdn.skypack.dev/react-dom";
        import AskAI from "./path-to-ask-ai"; // adjust import path
        ReactDOM.render(React.createElement(AskAI, { isCollapsed: false }), document.getElementById('root'));
      </script>
    `);

    const input = page.locator('input[placeholder="Ask AI anything about your emails"]');
    await input.fill('trigger limit');

    await page.locator('form').evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

    // Wait for toast error message
    await expect(page.locator('text=You have reached the limit for today')).toBeVisible();
  });

  test('renders nothing when isCollapsed is true', async ({ page }) => {
    await page.setContent(`
      <div id="root"></div>
      <script type="module">
        import React from "https://cdn.skypack.dev/react";
        import ReactDOM from "https://cdn.skypack.dev/react-dom";
        import AskAI from "./path-to-ask-ai"; // adjust import path
        ReactDOM.render(React.createElement(AskAI, { isCollapsed: true }), document.getElementById('root'));
      </script>
    `);

    // The component should render nothing (empty)
    const container = page.locator('#root');
    await expect(container).toBeEmpty();
  });
});
