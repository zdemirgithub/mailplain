import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as stripeActions from '@/lib/stripe-actions'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/server/db'
import { redirect } from 'next/navigation'

vi.mock('@clerk/nextjs/server')
vi.mock('@/lib/stripe')
vi.mock('@/server/db')
vi.mock('next/navigation')

describe('stripe-actions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('createCheckoutSession', () => {
    it('throws error if no userId', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: null })
      await expect(stripeActions.createCheckoutSession()).rejects.toThrow('User not found')
    })

    it('creates session and redirects', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user-1' })
      const sessionUrl = 'https://checkout.session.url'

      ;(stripe.checkout.sessions.create as unknown as jest.Mock).mockResolvedValue({
        url: sessionUrl,
      })

      const redirectMock = redirect as unknown as jest.Mock

      await stripeActions.createCheckoutSession()

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_URL}/mail`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
        client_reference_id: 'user-1',
      })
      expect(redirectMock).toHaveBeenCalledWith(sessionUrl)
    })
  })

  describe('createBillingPortalSession', () => {
    it('returns false if no userId', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: null })
      const result = await stripeActions.createBillingPortalSession()
      expect(result).toBe(false)
    })

    it('throws error if no subscription or customerId', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user-1' })
      (db.stripeSubscription.findUnique as unknown as jest.Mock).mockResolvedValue(null)
      await expect(stripeActions.createBillingPortalSession()).rejects.toThrow('Subscription not found')

      (db.stripeSubscription.findUnique as unknown as jest.Mock).mockResolvedValue({ customerId: null })
      await expect(stripeActions.createBillingPortalSession()).rejects.toThrow('Subscription not found')
    })

    it('creates billing portal session and redirects', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user-1' })
      (db.stripeSubscription.findUnique as unknown as jest.Mock).mockResolvedValue({ customerId: 'cus_123' })
      const sessionUrl = 'https://billing.portal.url'
      (stripe.billingPortal.sessions.create as unknown as jest.Mock).mockResolvedValue({ url: sessionUrl })

      const redirectMock = redirect as unknown as jest.Mock

      await stripeActions.createBillingPortalSession()

      expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        return_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      })
      expect(redirectMock).toHaveBeenCalledWith(sessionUrl)
    })
  })

  describe('getSubscriptionStatus', () => {
    it('returns false if no userId', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: null })
      const result = await stripeActions.getSubscriptionStatus()
      expect(result).toBe(false)
    })

    it('returns false if no subscription found', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user-1' })
      (db.stripeSubscription.findUnique as unknown as jest.Mock).mockResolvedValue(null)
      const result = await stripeActions.getSubscriptionStatus()
      expect(result).toBe(false)
    })

    it('returns true if currentPeriodEnd is in the future', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user-1' })
      (db.stripeSubscription.findUnique as unknown as jest.Mock).mockResolvedValue({
        currentPeriodEnd: new Date(Date.now() + 100000), // future
      })
      const result = await stripeActions.getSubscriptionStatus()
      expect(result).toBe(true)
    })

    it('returns false if currentPeriodEnd is in the past', async () => {
      (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'user-1' })
      (db.stripeSubscription.findUnique as unknown as jest.Mock).mockResolvedValue({
        currentPeriodEnd: new Date(Date.now() - 100000), // past
      })
      const result = await stripeActions.getSubscriptionStatus()
      expect(result).toBe(false)
    })
  })
})
