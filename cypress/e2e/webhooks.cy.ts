import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { webhooksRouter } from '@/server/api/routers/webhooks'
import type { AppRouter } from '@/server/api/root'

describe('webhooksRouter e2e tests', () => {
  // Setup tRPC client with auth headers (simulate logged-in user)
  const trpc = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: 'http://localhost:3000/api/trpc',
        headers() {
          return {
            Authorization: `Bearer test-user-token`, // Replace with a real test token or mock auth
          }
        },
      }),
    ],
  })

  const testAccountId = 'test-account-id'  // Provide a valid test account id for your environment
  let createdWebhookId: string

  it('should fetch existing webhooks', async () => {
    const webhooks = await trpc.webhooks.getWebhooks.query({ accountId: testAccountId })
    expect(webhooks).to.be.an('array')
  })

  it('should create a new webhook', async () => {
    const notificationUrl = 'https://example.com/notify'
    const webhook = await trpc.webhooks.createWebhook.mutate({
      accountId: testAccountId,
      notificationUrl,
    })
    expect(webhook).to.have.property('id')
    expect(webhook).to.have.property('notificationUrl', notificationUrl)
    createdWebhookId = webhook.id
  })

  it('should delete the created webhook', async () => {
    const response = await trpc.webhooks.deleteWebhook.mutate({
      accountId: testAccountId,
      webhookId: createdWebhookId,
    })
    expect(response).to.have.property('success', true)
  })
})
