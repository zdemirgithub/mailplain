import { mailRouter } from '@/server/api/routers/mail'
import { mockDeep, DeepMockProxy } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

jest.mock('@/lib/account', () => {
  return jest.fn().mockImplementation(() => ({
    syncEmails: jest.fn(),
    sendEmail: jest.fn()
  }))
})

import Account from '@/lib/account'

describe('mailRouter integration', () => {
  let ctx: any

  beforeEach(() => {
    // mock Prisma client
    const db = mockDeep<PrismaClient>()
    
    ctx = {
      db,
      auth: {
        userId: 'user-1'
      }
    }
  })

  describe('getAccounts', () => {
    it('returns accounts for authenticated user', async () => {
      ctx.db.account.findMany.mockResolvedValue([
        { id: 'acc-1', emailAddress: 'test@example.com', name: 'Test Account' }
      ])

      const result = await mailRouter.getAccounts({ ctx, input: undefined })

      expect(result).toEqual([
        { id: 'acc-1', emailAddress: 'test@example.com', name: 'Test Account' }
      ])
      expect(ctx.db.account.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: { id: true, emailAddress: true, name: true }
      })
    })
  })

  describe('getNumThreads', () => {
    it('returns count of inbox threads for account', async () => {
      ctx.db.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        emailAddress: 'test@example.com',
        name: 'Test',
        token: 'token'
      })
      ctx.db.thread.count.mockResolvedValue(42)

      const input = { accountId: 'acc-1', tab: 'inbox' }

      const count = await mailRouter.getNumThreads({ ctx, input })

      expect(ctx.db.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'acc-1', userId: 'user-1' },
        select: { id: true, emailAddress: true, name: true, token: true }
      })

      expect(ctx.db.thread.count).toHaveBeenCalledWith({
        where: { accountId: 'acc-1', inboxStatus: true }
      })

      expect(count).toBe(42)
    })

    it('throws if account unauthorized', async () => {
      ctx.db.account.findFirst.mockResolvedValue(null)
      await expect(mailRouter.getNumThreads({
        ctx,
        input: { accountId: 'acc-1', tab: 'inbox' }
      })).rejects.toThrow('Invalid token')
    })
  })

  describe('setDone mutation', () => {
    it('sets done flag on a single thread', async () => {
      ctx.db.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        emailAddress: 'a@b.com',
        name: 'A',
        token: 'token'
      })
      ctx.db.thread.update.mockResolvedValue({ id: 'thread-1', done: true })

      const input = { accountId: 'acc-1', threadId: 'thread-1' }

      await mailRouter.setDone.mutate({ ctx, input })

      expect(ctx.db.thread.update).toHaveBeenCalledWith({
        where: { id: 'thread-1' },
        data: { done: true }
      })
    })

    it('throws if no threadId or threadIds provided', async () => {
      await expect(mailRouter.setDone.mutate({ ctx, input: { accountId: 'acc-1' } }))
        .rejects.toThrow('No threadId or threadIds provided')
    })
  })

  describe('sendEmail mutation', () => {
    it('calls Account.sendEmail with correct args', async () => {
      ctx.db.account.findFirst.mockResolvedValue({
        id: 'acc-1',
        userId: 'user-1',
        emailAddress: 'a@b.com',
        name: 'A',
        token: 'token'
      })

      const sendEmailMock = jest.fn()
      // Override Account class with mocked sendEmail method
      (Account as jest.Mock).mockImplementation(() => ({
        sendEmail: sendEmailMock
      }))

      const input = {
        accountId: 'acc-1',
        body: 'Hello',
        subject: 'Hi',
        from: { address: 'a@b.com', name: 'A' },
        to: [{ address: 'b@b.com', name: 'B' }],
        cc: [],
        bcc: [],
        replyTo: { address: 'a@b.com', name: 'A' },
        inReplyTo: undefined,
        threadId: undefined,
      }

      await mailRouter.sendEmail.mutate({ ctx, input })

      expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({
        body: 'Hello',
        subject: 'Hi',
        to: input.to,
        from: input.from
      }))
    })
  })
})
