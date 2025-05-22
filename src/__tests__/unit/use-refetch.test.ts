import { renderHook, act } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import useRefetch from './use-refetch'

jest.mock('@tanstack/react-query')

describe('useRefetch', () => {
  it('should call refetchQueries on queryClient with type active', async () => {
    const refetchQueriesMock = jest.fn().mockResolvedValue(undefined)
    ;(useQueryClient as jest.Mock).mockReturnValue({
      refetchQueries: refetchQueriesMock,
    })

    const { result } = renderHook(() => useRefetch())

    await act(async () => {
      await result.current()
    })

    expect(refetchQueriesMock).toHaveBeenCalledWith({ type: 'active' })
  })
})
