
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import Account from '@/lib/account'
import { db } from '@/server/db'
import { syncEmailsToDatabase } from '@/lib/sync-to-db'

vi.mock('axios')
vi.mock('@/server/db', () => ({
  db: {
    account: {
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))
vi.mock('@/lib/sync-to-db', () => ({
  syncEmailsToDatabase: vi.fn()
}))

describe('Account class', () => {
  const token = 'test-token'
  let accountInstance: Account

  beforeEach(() => {
    accountInstance = new Account(token)
  })

  it('createSubscription() should call axios with correct args', async () => {
    const postMock = vi.spyOn(axios, 'post').mockResolvedValue({ data: { success: true } })

    process.env.NODE_ENV = 'development'
    await accountInstance.createSubscription()

    expect(postMock).toHaveBeenCalledWith(
      'https://api.aurinko.io/v1/subscriptions',
      {
        resource: '/email/messages',
        notificationUrl: expect.stringContaining('/api/aurinko/webhook')
      },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`
        })
      })
    )
  })

  it('getUpdatedEmails() should call axios.get with correct headers and params', async () => {
    const getMock = vi.spyOn(axios, 'get').mockResolvedValue({ data: { records: [], nextDeltaToken: '', nextPageToken: '' } })

    const result = await accountInstance.getUpdatedEmails({ deltaToken: 'delta' })

    expect(getMock).toHaveBeenCalledWith(
      'https://api.aurinko.io/v1/email/sync/updated',
      expect.objectContaining({
        params: { deltaToken: 'delta' },
        headers: { Authorization: `Bearer ${token}` }
      })
    )

    expect(result).toEqual({ records: [], nextDeltaToken: '', nextPageToken: '' })
  })

  it('sendEmail() should call axios.post with correct data', async () => {
    const postMock = vi.spyOn(axios, 'post').mockResolvedValue({ data: { id: '123' } })
    const emailData = {
      from: { name: 'Me', address: 'me@example.com' },
      subject: 'Hello',
      body: 'Body content',
      to: [{ name: 'You', address: 'you@example.com' }],
      cc: [], bcc: [], replyTo: { name: 'Me', address: 'me@example.com' }
    }

    const result = await accountInstance.sendEmail(emailData as any)

    expect(postMock).toHaveBeenCalled()
    expect(result).toEqual({ id: '123' })
  })

  it('getWebhooks() should return webhook records', async () => {
    const mockResponse = { data: { records: [], totalSize: 0, offset: 0, done: true } }
    vi.spyOn(axios, 'get').mockResolvedValue(mockResponse)

    const result = await accountInstance.getWebhooks()
    expect(result).toEqual(mockResponse.data)
  })

  it('createWebhook() should call axios.post and return result', async () => {
    const mockData = { id: '123' }
    vi.spyOn(axios, 'post').mockResolvedValue({ data: mockData })

    const result = await accountInstance.createWebhook('/email', 'http://webhook.test')
    expect(result).toEqual(mockData)
  })

  it('deleteWebhook() should call axios.delete and return result', async () => {
    const mockData = { success: true }
    vi.spyOn(axios, 'delete').mockResolvedValue({ data: mockData })

    const result = await accountInstance.deleteWebhook('sub-123')
    expect(result).toEqual(mockData)
  })
})
