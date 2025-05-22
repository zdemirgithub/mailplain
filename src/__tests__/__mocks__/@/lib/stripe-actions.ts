// src/__tests__/__mocks__/@/lib/stripe-actions.ts
export const createCheckoutSession = jest.fn(() => Promise.resolve("checkout-session-mock"))
export const createBillingPortalSession = jest.fn(() => Promise.resolve("billing-portal-mock"))
export const getSubscriptionStatus = jest.fn(() => Promise.resolve(true)) // or false to simulate unsubscribed
