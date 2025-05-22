import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/server/(.*)$': '<rootDir>/src/server/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@/trpc/(.*)$': '<rootDir>/src/trpc/$1',
    '^@clerk/nextjs$': '<rootDir>/src/__tests__/__mocks__/@clerk/nextjs.ts',
    '^@aurinko/client$': '<rootDir>/src/__tests__/__mocks__/@aurinko/client.ts',
    '^@/lib/stripe-actions$': '<rootDir>/src/__tests__/__mocks__/@/lib/stripe-actions.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/cypress/'],
}

export default config
