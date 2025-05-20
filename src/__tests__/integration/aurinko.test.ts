import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getAurinkoAuthorizationUrl,
  getAurinkoToken,
  getAccountDetails,
  getEmailDetails,
} from '@/lib/aurinko'
import axios from 'axios'

vi.mock('axios')
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'user123' }),
}))

vi.mock('@/lib/stripe-actions', () => ({
  getSubscriptionStatus: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/server/db', () => ({
  db: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ role: 'user' }),
    },
    account: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

const mockedAxios = axios as unknown as {
  post: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
}

describe('aurinko.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAurinkoAuthorizationUrl', () => {
    it('should return a valid auth URL when conditions are met', async () => {
      process.env.AURINKO_CLIENT_ID = 'fake_id'
      process.env.NEXT_PUBLIC_URL = 'http://localhost:3000'

      const url = await getAurinkoAuthorizationUrl('Google')
      expect(url).toContain('https://api.aurinko.io/v1/auth/authorize')
      expect(url).toContain('clientId=fake_id')
      expect(url).toContain('serviceType=Google')
    })

    it('should throw if user has reached max accounts (free)', async () => {
      const { db } = await import('@/server/db')
      const { getSubscriptionStatus } = await import('@/lib/stripe-actions')
      db.account.count.mockResolvedValue(3)
      getSubscriptionStatus.mockResolvedValue(false)

      await expect(getAurinkoAuthorizationUrl('Google')).rejects.toThrow(/maximum number of accounts/)
    })
  })

  describe('getAurinkoToken', () => {
    it('should return token info on success', async () => {
      mockedAxios.post = vi.fn().mockResolvedValue({
        data: {
          accountId: 1,
          accessToken: 'abc123',
          userId: 'u1',
          userSession: 'sess',
        },
      })

      const result = await getAurinkoToken('auth_code')
      expect(result?.accessToken).toBe('abc123')
    })
  })

  describe('getAccountDetails', () => {
    it('should return account info', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({
        data: {
          email: 'user@example.com',
          name: 'Test User',
        },
      })

      const result = await getAccountDetails('token')
      expect(result.email).toBe('user@example.com')
    })
  })

  describe('getEmailDetails', () => {
    it('should return email info', async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({
        data: {
          id: 'email123',
          subject: 'Test Subject',
          body: 'Hello',
        },
      })

      const result = await getEmailDetails('token', 'email123')
      expect(result.id).toBe('email123')
    })
  })
})
