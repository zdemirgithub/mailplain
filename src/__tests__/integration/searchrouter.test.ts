import { searchRouter } from '@/server/api/routers/search'
import { mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'
import { OramaManager } from '@/lib/orama'

// Mock OramaManager class
jest.mock('@/lib/orama', () => {
  return {
    OramaManager: jest.fn().mockImplementation(() => ({
      initialize: jest.fn(),
      search: jest.fn()
    }))
  }
})

describe('searchRouter integration', () => {
  let ctx: any
  let oramaMock: jest.Mocked<OramaManager>

  beforeEach(() => {
    const db = mockDeep<PrismaClient>()
    ctx = {
      db,
      auth: { userId: 'user-123' }
    }
    oramaMock = new OramaManager('') as jest.Mocked<OramaManager>
  })

  it('throws error if account not found', async () => {
    ctx.db.account.findFirst.mockResolvedValue(null)
    await expect(searchRouter.search.mutate({
      ctx,
      input: { accountId: 'acc-1', query: 'test' }
    })).rejects.toThrow('Invalid token')
  })

  it('returns search results', async () => {
    ctx.db.account.findFirst.mockResolvedValue({ id: 'acc-1' })
    ;(OramaManager as jest.Mock).mockImplementation(() => oramaMock)
    oramaMock.initialize.mockResolvedValue(undefined)
    const fakeResults = [{ id: 'result1' }, { id: 'result2' }]
    oramaMock.search.mockResolvedValue(fakeResults)

    const result = await searchRouter.search.mutate({
      ctx,
      input: { accountId: 'acc-1', query: 'find me' }
    })

    expect(ctx.db.account.findFirst).toHaveBeenCalledWith({
      where: { id: 'acc-1', userId: 'user-123' },
      select: { id: true }
    })
    expect(oramaMock.initialize).toHaveBeenCalled()
    expect(oramaMock.search).toHaveBeenCalledWith({ term: 'find me' })
    expect(result).toEqual(fakeResults)
  })
})
