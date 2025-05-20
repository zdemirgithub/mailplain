import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mailRouter, authoriseAccountAccess } from '@/routers/mail'
import Account from '@/lib/account'
import { getEmailDetails } from '@/lib/aurinko'

vi.mock('@/server/db', () => ({
  db: {
    account: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    thread: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    emailAddress: {
      findMany: vi.fn(),
    },
    chatbotInteraction: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/account')
vi.mock('@/lib/aurinko')

describe('mailRouter', () => {
  const ctx = {
    auth: { userId: 'user1' },
    db: require('@/server/db').db,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('authoriseAccountAccess', () => {
    it('returns account when found', async () => {
      const { db } = ctx
      db.account.findFirst.mockResolvedValue({
        id: 'acc1',
        emailAddress: 'test@example.com',
        name: 'Test',
        token: 'token123',
      })
      const account = await authoriseAccountAccess('acc1', 'user1')
      expect(account.id).toBe('acc1')
    })

    it('throws if no account', async () => {
      ctx.db.account.findFirst.mockResolvedValue(null)
      await expect(authoriseAccountAccess('acc1', 'user1')).rejects.toThrow('Invalid token')
    })
  })

  describe('getAccounts', () => {
    it('returns accounts for user', async () => {
      ctx.db.account.findMany.mockResolvedValue([{ id: 'acc1', emailAddress: 'a@b.com', name: 'A' }])
      const result = await mailRouter.getAccounts.resolve({ ctx })
      expect(result).toHaveLength(1)
      expect(result[0].emailAddress).toBe('a@b.com')
    })
  })

  describe('getNumThreads', () => {
    it('returns count of inbox threads', async () => {
      ctx.db.account.findFirst.mockResolvedValue({ id: 'acc1', userId: 'user1' })
      ctx.db.thread.count.mockResolvedValue(5)

      const input = { accountId: 'acc1', tab: 'inbox' }
      const result = await mailRouter.getNumThreads.resolve({ ctx, input })
      expect(result).toBe(5)
    })
  })

  describe('syncEmails', () => {
    it('calls Account.syncEmails', async () => {
      const accObj = { syncEmails: vi.fn() }
      ctx.db.account.findFirst.mockResolvedValue({ id: 'acc1', token: 'token123' })
      ;(Account as unknown as jest.Mock).mockImplementation(() => accObj)

      await mailRouter.syncEmails.mutate({ ctx, input: { accountId: 'acc1' } })
      expect(accObj.syncEmails).toHaveBeenCalled()
    })
  })

  describe('sendEmail', () => {
    it('calls Account.sendEmail with input', async () => {
      const sendEmailMock = vi.fn()
      const accObj = { sendEmail: sendEmailMock }
      ctx.db.account.findFirst.mockResolvedValue({ id: 'acc1', token: 'token123' })
      ;(Account as unknown as jest.Mock).mockImplementation(() => accObj)

      const input = {
        accountId: 'acc1',
        body: 'Hello',
        subject: 'Subj',
        from: { address: 'from@test.com', name: 'From' },
        to: [{ address: 'to@test.com', name: 'To' }],
        cc: [],
        bcc: [],
        replyTo: { address: 'reply@test.com', name: 'Reply' },
        inReplyTo: undefined,
        threadId: undefined,
      }

      await mailRouter.sendEmail.mutate({ ctx, input })
      expect(sendEmailMock).toHaveBeenCalledWith(expect.objectContaining({
        body: 'Hello',
        subject: 'Subj',
      }))
    })
  })

  describe('getEmailDetails', () => {
    it('calls getEmailDetails with token and emailId', async () => {
      ctx.db.account.findFirst.mockResolvedValue({ token: 'token123' })
      ;(getEmailDetails as vi.Mock).mockResolvedValue({ id: 'email1' })

      const input = { accountId: 'acc1', emailId: 'email1' }
      const result = await mailRouter.getEmailDetails.resolve({ ctx, input })
      expect(getEmailDetails).toHaveBeenCalledWith('token123', 'email1')
      expect(result.id).toBe('email1')
    })
  })

  // Additional tests can be added for:
  // - getThreads
  // - getThreadById
  // - getReplyDetails
  // - setDone / setUndone (test DB updates)
  // - getEmailSuggestions
  // - getMyAccount
  // - getChatbotInteraction
})
