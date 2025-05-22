// src/__tests__/__mocks__/@clerk/nextjs.ts
export const UserButton = () => <div data-testid="user-button" />
export const auth = jest.fn(() => ({ userId: 'mock-user', sessionId: 'mock-session' }))
export const currentUser = jest.fn(() => Promise.resolve({ id: 'mock-user', email: 'mock@example.com' }))
export const clerkClient = {
  users: {
    getUser: jest.fn(() => Promise.resolve({ id: 'mock-user', email: 'mock@example.com' }))
  }
}
