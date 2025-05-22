import * as trpcServer from '@/server/api/trpc/server';
import { createCaller } from '@/server/api/root';

jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Headers({ 'user-agent': 'jest-test' })),
}));

describe('trpc/server', () => {
  it('createContext includes custom header x-trpc-source', () => {
    const ctx = (trpcServer as any).createContext();
    expect(ctx.headers.get('x-trpc-source')).toBe('rsc');
  });

  it('createCaller calls a router procedure', async () => {
    // Mock a simple procedure in root router for test
    const caller = (trpcServer as any).caller;

    // Assuming your root router has a hello procedure for test purpose
    // Replace with an actual procedure from your router or mock it accordingly
    const result = await caller.hello.query({ text: 'test' });
    expect(result.greeting).toBe('Hello test');
  });

  it('exports trpc and HydrateClient helpers', () => {
    expect(trpcServer.api).toBeDefined();
    expect(trpcServer.HydrateClient).toBeDefined();
  });
});
