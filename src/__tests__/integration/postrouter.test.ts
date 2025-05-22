import { postRouter } from '@/server/api/routers/post'
import { mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

describe('postRouter integration', () => {
  let ctx: any

  beforeEach(() => {
    // Mock Prisma client for db calls
    const db = mockDeep<PrismaClient>()
    ctx = { db }
  })

  describe('hello query', () => {
    it('returns greeting with input text', async () => {
      const input = { text: 'World' }
      const result = await postRouter.hello.query({ ctx, input })
      expect(result).toEqual({ greeting: 'Hello World' })
    })
  })

  describe('create mutation', () => {
    it('creates a post with the given name', async () => {
      const input = { name: 'New Post' }
      const createdPost = { id: 'post1', name: 'New Post' }
      ctx.db.post.create.mockResolvedValue(createdPost)

      const result = await postRouter.create.mutate({ ctx, input })

      expect(ctx.db.post.create).toHaveBeenCalledWith({
        data: { name: 'New Post' }
      })
      expect(result).toEqual(createdPost)
    })
  })

  describe('getLatest query', () => {
    it('returns the latest post if found', async () => {
      const latestPost = { id: 'post2', name: 'Latest Post', createdAt: new Date() }
      ctx.db.post.findFirst.mockResolvedValue(latestPost)

      const result = await postRouter.getLatest.query({ ctx })

      expect(ctx.db.post.findFirst).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' }
      })
      expect(result).toEqual(latestPost)
    })

    it('returns null if no post found', async () => {
      ctx.db.post.findFirst.mockResolvedValue(null)

      const result = await postRouter.getLatest.query({ ctx })

      expect(result).toBeNull()
    })
  })
})
