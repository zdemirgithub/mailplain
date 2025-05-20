// Mock implementation of Clerk auth for tests
export const mockUser = {
  id: 'test-user-id',
  email: 'testuser@example.com',
  firstName: 'Test',
  lastName: 'User',
};

export const clerkMock = {
  auth: () => ({
    userId: mockUser.id,
    user: mockUser,
  }),
  isSignedIn: () => true,
  signOut: jest.fn(),
};

// For usage with jest.mock('@clerk/nextjs', () => clerkMock)
