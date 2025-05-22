import { webhooksRouter } from '@/server/api/routers/webhooks'
import { mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'
import Account from '@/lib/account'
import * as mailModule from '@/server/api/routers/mail'

jest.mock('@/lib/account')

describe('webhooksRouter integration', () => {
  let ctx: any
  const userId = 'user-123'
  const accountId = 'acc-1'

  beforeEach(() => {
    jest.clearAllMocks()
    const db = mockDeep<PrismaClient>()
    ctx = { db, auth: { userId } }
  })

  it('getWebhooks returns webhooks list', async () => {
    // Mock authoriseAccountAccess to return account with token
    jest.spyOn(mailModule, 'authoriseAccountAccess').mockResolvedValue({
      id: accountId,
      token: 'token-abc',
      emailAddress: 'test@example.com',
      name: 'Test Account'
    } as any)

    const getWebhooksMock = jest.fn().mockResolvedValue([{ id: 'wh-1' }, { id: 'wh-2' }])
    ;(Account as jest.Mock).mockImplementation(() => ({
      getWebhooks: getWebhooksMock,
    }))

    const result = await webhooksRouter.getWebhooks.query({ ctx, input: { accountId } })

    expect(mailModule.authoriseAccountAccess).toHaveBeenCalledWith(accountId, userId)
    expect(getWebhooksMock).toHaveBeenCalled()
    expect(result).toEqual([{ id: 'wh-1' }, { id: 'wh-2' }])
  })

  it('createWebhook calls createWebhook on Account', async () => {
    jest.spyOn(mailModule, 'authoriseAccountAccess').mockResolvedValue({
      id: accountId,
      token: 'token-abc',
      emailAddress: 'test@example.com',
      name: 'Test Account'
    } as any)

    const createWebhookMock = jest.fn().mockResolvedValue({ success: true })
    ;(Account as jest.Mock).mockImplementation(() => ({
      createWebhook: createWebhookMock,
    }))

    const notificationUrl = 'https://example.com/notify'
    const result = await webhooksRouter.createWebhook.mutate({
      ctx,
      input: { accountId, notificationUrl }
    })

    expect(mailModule.authoriseAccountAccess).toHaveBeenCalledWith(accountId, userId)
    expect(createWebhookMock).toHaveBeenCalledWith('/email/messages', notificationUrl)
    expect(result).toEqual({ success: true })
  })

  it('deleteWebhook calls deleteWebhook on Account', async () => {
    jest.spyOn(mailModule, 'authoriseAccountAccess').mockResolvedValue({
      id: accountId,
      token: 'token-abc',
      emailAddress: 'test@example.com',
      name: 'Test Account'
    } as any)

    const deleteWebhookMock = jest.fn().mockResolvedValue({ deleted: true })
    ;(Account as jest.Mock).mockImplementation(() => ({
      deleteWebhook: deleteWebhookMock,
    }))

    const webhookId = 'webhook-123'
    const result = await webhooksRouter.deleteWebhook.mutate({
      ctx,
      input: { accountId, webhookId }
    })

    expect(mailModule.authoriseAccountAccess).toHaveBeenCalledWith(accountId, userId)
    expect(deleteWebhookMock).toHaveBeenCalledWith(webhookId)
    expect(result).toEqual({ deleted: true })
  })
})
