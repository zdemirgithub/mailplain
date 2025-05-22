/**
 * @jest-environment node
 */

import * as stripeActions from '@/lib/stripe-actions';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/server/db';
import { redirect } from 'next/navigation';

jest.mock('@clerk/nextjs/server');
jest.mock('@/lib/stripe');
jest.mock('@/server/db');
jest.mock('next/navigation');

describe('stripe-actions.ts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session and redirect', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });
      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        url: 'https://stripe.com/session-url',
      });
      (redirect as jest.Mock).mockImplementation(() => {});

      await stripeActions.createCheckoutSession();

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
        client_reference_id: 'user123',
      });

      expect(redirect).toHaveBeenCalledWith('https://stripe.com/session-url');
    });

    it('should throw error if no userId', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: null });

      await expect(stripeActions.createCheckoutSession()).rejects.toThrow('User not found');
    });
  });

  describe('createBillingPortalSession', () => {
    it('should create billing portal session and redirect', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });
      (db.stripeSubscription.findUnique as jest.Mock).mockResolvedValue({
        customerId: 'cus_123',
      });
      (stripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue({
        url: 'https://stripe.com/billing-portal',
      });
      (redirect as jest.Mock).mockImplementation(() => {});

      await stripeActions.createBillingPortalSession();

      expect(db.stripeSubscription.findUnique).toHaveBeenCalledWith({ where: { userId: 'user123' } });
      expect(stripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        return_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
      });
      expect(redirect).toHaveBeenCalledWith('https://stripe.com/billing-portal');
    });

    it('should return false if no userId', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: null });

      const result = await stripeActions.createBillingPortalSession();
      expect(result).toBe(false);
    });

    it('should throw error if subscription missing customerId', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });
      (db.stripeSubscription.findUnique as jest.Mock).mockResolvedValue({ customerId: null });

      await expect(stripeActions.createBillingPortalSession()).rejects.toThrow('Subscription not found');
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return true if subscription is active', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });
      (db.stripeSubscription.findUnique as jest.Mock).mockResolvedValue({
        currentPeriodEnd: new Date(Date.now() + 100000), // future date
      });

      const result = await stripeActions.getSubscriptionStatus();
      expect(result).toBe(true);
    });

    it('should return false if no userId', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: null });

      const result = await stripeActions.getSubscriptionStatus();
      expect(result).toBe(false);
    });

    it('should return false if no subscription', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });
      (db.stripeSubscription.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await stripeActions.getSubscriptionStatus();
      expect(result).toBe(false);
    });

    it('should return false if subscription expired', async () => {
      (auth as jest.Mock).mockResolvedValue({ userId: 'user123' });
      (db.stripeSubscription.findUnique as jest.Mock).mockResolvedValue({
        currentPeriodEnd: new Date(Date.now() - 100000), // past date
      });

      const result = await stripeActions.getSubscriptionStatus();
      expect(result).toBe(false);
    });
  });
});
