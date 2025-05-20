import { createTRPCProxyClient, httpBatchLink } from '@trpc/client'
import type { AppRouter } from '@/server/api/root'

describe('tRPC App Router e2e tests', () => {
  // Create a tRPC client pointing to local dev server
  const trpc = createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        url: 'http://localhost:3000/api/trpc',
      }),
    ],
  })

  it('should have mail router responding', async () => {
    const result = await trpc.mail.all() // assuming mail router has an "all" procedure
    expect(result).to.be.an('array')
  })

  it('should have search router responding', async () => {
    const result = await trpc.search.query({ query: 'test' }) // assuming search router has query procedure
    expect(result).to.have.property('results')
  })

  it('should have webhooks router responding', async () => {
    // Some basic call to webhook endpoint, if it has a testable procedure
    const result = await trpc.webhooks.ping() // example procedure
    expect(result).to.equal('pong')
  })
})
