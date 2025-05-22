import { test, expect } from '@playwright/test';

test.describe('ReplyBox component', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the tRPC query response for getReplyDetails
    await page.route('**/api/trpc/mail.getReplyDetails', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              id: 'reply-id-123',
              subject: 'Hello World',
              from: { name: 'Alice', address: 'alice@example.com' },
              to: [{ name: 'Bob', address: 'bob@example.com' }],
              cc: [],
            }
          }
        }),
      });
    });

    // Mock sendEmail mutation API
    await page.route('**/api/trpc/mail.sendEmail', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: { data: true }
        }),
      });
    });
  });

  test('renders ReplyBox and sends email', async ({ page }) => {
    // Mount your ReplyBox component somehow, example:
    await page.setContent(`
      <div id="root"></div>
      <script type="module">
        import React from "https://cdn.skypack.dev/react";
        import ReactDOM from "https://cdn.skypack.dev/react-dom";
        import ReplyBox from "./path-to-reply-box"; // adjust the import path
        ReactDOM.render(React.createElement(ReplyBox), document.getElementById('root'));
      </script>
    `);

    // Wait for subject input and check it starts with "Re: "
    const subjectInput = page.locator('input[name="subject"]');
    await expect(subjectInput).toHaveValue(/^Re: Hello World$/);

    // Simulate user typing in the email body editor (assuming it has a textarea)
    const editor = page.locator('textarea[name="email-body"]');
    await editor.fill('This is a reply message.');

    // Click the send button
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for toast success message
    await expect(page.locator('text=Email sent')).toBeVisible();
  });
});
