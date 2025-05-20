import { vi, describe, it, expect } from 'vitest'
import middleware from '@/middleware'
import { NextRequest } from 'next/server'

// Mocks
const protectMock = vi.fn()
const mockAuth = vi.fn(() => ({ protect: protectMock }))

vi.mock('@clerk/nextjs/server', async () => {
  const actual = await vi.importActual('@clerk/nextjs/server')
  return {
    ...actual,
    clerkMiddleware: (handler: any) => (req: any) => handler(mockAuth, req),
    createRouteMatcher: (routes: string[]) => {
      const regexes = routes.map((route) => new RegExp(`^${route}$`))
      return (req: NextRequest) => regexes.some((regex) => regex.test(req.nextUrl.pathname))
    },
  }
})

describe('middleware', () => {
  beforeEach(() => {
    protectMock.mockClear()
  })

  it('should NOT call protect for a public route', async () => {
    const req = {
      nextUrl: { pathname: '/sign-in' }
    } as NextRequest

    await middleware(req)
    expect(protectMock).not.toHaveBeenCalled()
  })

  it('should call protect for a protected route', async () => {
    const req = {
      nextUrl: { pathname: '/dashboard' }
    } as NextRequest

    await middleware(req)
    expect(protectMock).toHaveBeenCalled()
  })
})
