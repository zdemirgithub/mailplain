import { cn } from './utils'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

jest.mock('clsx')
jest.mock('tailwind-merge')

describe('cn utility function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should call clsx and twMerge with correct arguments', () => {
    ;(clsx as jest.Mock).mockReturnValue('clsx-result')
    ;(twMerge as jest.Mock).mockReturnValue('twmerged-result')

    const result = cn('foo', { bar: true }, ['baz', 'qux'])

    expect(clsx).toHaveBeenCalledWith(['foo', { bar: true }, ['baz', 'qux']])
    expect(twMerge).toHaveBeenCalledWith('clsx-result')
    expect(result).toBe('twmerged-result')
  })

  it('should handle no arguments gracefully', () => {
    ;(clsx as jest.Mock).mockReturnValue('')
    ;(twMerge as jest.Mock).mockReturnValue('')

    const result = cn()

    expect(clsx).toHaveBeenCalledWith([])
    expect(twMerge).toHaveBeenCalledWith('')
    expect(result).toBe('')
  })
})
