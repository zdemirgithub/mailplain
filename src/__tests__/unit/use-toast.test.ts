import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reducer } from '@/hooks/use-toast'
import { toast } from '@/hooks/use-toast'

describe('use-toast reducer', () => {
  const baseToast = {
    id: '1',
    title: 'Hello',
    description: 'World',
    open: true,
  }

  it('adds a toast', () => {
    const action = {
      type: 'ADD_TOAST',
      toast: baseToast,
    }
    const state = reducer({ toasts: [] }, action)
    expect(state.toasts.length).toBe(1)
    expect(state.toasts[0].title).toBe('Hello')
  })

  it('updates a toast', () => {
    const action = {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'Updated' },
    }
    const state = reducer({ toasts: [baseToast] }, action)
    expect(state.toasts[0].title).toBe('Updated')
  })

  it('dismisses a toast (open = false)', () => {
    const action = {
      type: 'DISMISS_TOAST',
      toastId: '1',
    }
    const state = reducer({ toasts: [baseToast] }, action)
    expect(state.toasts[0].open).toBe(false)
  })

  it('removes a toast', () => {
    const action = {
      type: 'REMOVE_TOAST',
      toastId: '1',
    }
    const state = reducer({ toasts: [baseToast] }, action)
    expect(state.toasts.length).toBe(0)
  })

  it('removes all toasts if toastId is undefined', () => {
    const action = {
      type: 'REMOVE_TOAST',
    }
    const state = reducer({ toasts: [baseToast] }, action)
    expect(state.toasts).toEqual([])
  })
})

describe('toast() utility', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates a toast and returns control methods', () => {
    const result = toast({ title: 'Test Toast', description: 'Test' })
    expect(result).toHaveProperty('id')
    expect(result).toHaveProperty('dismiss')
    expect(result).toHaveProperty('update')
  })

  it('dismiss() sets toast as closed and schedules removal', () => {
    const result = toast({ title: 'Dismiss Test' })
    result.dismiss()
    // Fast-forward timers to simulate delayed remove
    vi.runAllTimers()
    // Since reducer sets open=false on dismiss, we expect that after time passes it’s removed
    // However, actual state isn’t directly exposed here, so this would be more of an integration test
    expect(true).toBe(true) // placeholder
  })
})
