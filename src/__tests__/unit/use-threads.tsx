import { renderHook } from '@testing-library/react'
import useThreads from './use-threads'
import * as trpc from '@/trpc/react'
import * as usehooksTs from 'usehooks-ts'

// Mock TRPC API hooks
const mockGetAccounts = jest.fn()
const mockGetThreads = jest.fn()

jest.mock('@/trpc/react', () => ({
  api: {
    mail: {
      getAccounts: {
        useQuery: () => mockGetAccounts(),
      },
      getThreads: {
        useQuery: (args: any, options: any) => mockGetThreads(args, options),
      },
    },
  },
  getQueryKey: jest.fn(),
}))

// Mock useLocalStorage hook
jest.mock('usehooks-ts', () => ({
  useLocalStorage: jest.fn(),
}))

describe('useThreads', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns initial data correctly', () => {
    // Setup mock returns
    const fakeAccountId = 'account-1'
    const fakeTab = 'inbox'
    const fakeDone = false

    (usehooksTs.useLocalStorage as jest.Mock)
      .mockImplementationOnce(() => [fakeAccountId, jest.fn()]) // accountId
      .mockImplementationOnce(() => [fakeTab, jest.fn()])       // tab
      .mockImplementationOnce(() => [fakeDone, jest.fn()])      // done

    const fakeAccounts = [{ id: fakeAccountId, name: 'Test Account' }]
    const fakeThreads = [{ id: 'thread-1' }]

    mockGetAccounts.mockReturnValue({ data: fakeAccounts })
    mockGetThreads.mockReturnValue({
      data: fakeThreads,
      isFetching: false,
      refetch: jest.fn(),
    })
    // Mock getQueryKey to just return a string for simplicity
    (trpc.getQueryKey as jest.Mock).mockReturnValue('mock-query-key')

    const { result } = renderHook(() => useThreads())

    expect(result.current.accountId).toBe(fakeAccountId)
    expect(result.current.account).toEqual(fakeAccounts[0])
    expect(result.current.accounts).toEqual(fakeAccounts)
    expect(result.current.threads).toEqual(fakeThreads)
    expect(result.current.isFetching).toBe(false)
    expect(result.current.queryKey).toBe('mock-query-key')
    expect(typeof result.current.refetch).toBe('function')
  })

  it('disables query if accountId or tab missing', () => {
    (usehooksTs.useLocalStorage as jest.Mock)
      .mockImplementationOnce(() => ['', jest.fn()]) // accountId empty
      .mockImplementationOnce(() => ['', jest.fn()]) // tab empty
      .mockImplementationOnce(() => [false, jest.fn()]) // done

    mockGetAccounts.mockReturnValue({ data: [] })
    mockGetThreads.mockReturnValue({
      data: [],
      isFetching: false,
      refetch: jest.fn(),
    })
    (trpc.getQueryKey as jest.Mock).mockReturnValue('mock-query-key')

    const { result } = renderHook(() => useThreads())

    expect(result.current.threads).toEqual([])
    expect(result.current.isFetching).toBe(false)
  })
})
