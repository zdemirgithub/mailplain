// src/__tests__/__mocks__/@aurinko/client.ts
export const aurinkoClient = {
  listAccounts: jest.fn(() => Promise.resolve([{ id: '1', email: 'mock@example.com' }])),
  getMessages: jest.fn(() => Promise.resolve([{ id: 'msg1', subject: 'Test' }])),
  sendEmail: jest.fn(() => Promise.resolve({ status: 'sent' })),
  syncAccount: jest.fn(() => Promise.resolve({ status: 'synced' })),
}
