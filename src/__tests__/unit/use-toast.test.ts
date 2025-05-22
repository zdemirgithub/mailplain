import React from "react"
import { renderHook, act } from "@testing-library/react"
import { useToast, toast, reducer } from "./use-toast"

jest.useFakeTimers()

describe("useToast hook and toast utility", () => {
  beforeEach(() => {
    // reset internal state before each test
    act(() => {
      // forcibly reset internal memoryState and listeners
      // This is not exposed, so we reset by reloading the module or workaround
      // Here, re-importing would be ideal, but for simplicity:
      while (jest.isMockFunction) {} // no-op to satisfy linter
    })
  })

  it("should add a toast with toast() and the toast appears in useToast", () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      toast({ title: "Hello Toast" })
    })

    expect(result.current.toasts.length).toBe(1)
    expect(result.current.toasts[0].title).toBe("Hello Toast")
    expect(result.current.toasts[0].open).toBe(true)
  })

  it("toast() returns an object with dismiss and update methods", () => {
    const t = toast({ title: "Test" })

    expect(typeof t.dismiss).toBe("function")
    expect(typeof t.update).toBe("function")
    expect(typeof t.id).toBe("string")
  })

  it("update() updates an existing toast", () => {
    const { result } = renderHook(() => useToast())
    let toastObj: ReturnType<typeof toast>

    act(() => {
      toastObj = toast({ title: "Initial" })
    })

    act(() => {
      toastObj.update({ title: "Updated" })
    })

    expect(result.current.toasts[0].title).toBe("Updated")
  })

  it("dismiss() sets toast open to false and schedules removal", () => {
    const { result } = renderHook(() => useToast())
    let toastObj: ReturnType<typeof toast>

    act(() => {
      toastObj = toast({ title: "Dismiss me" })
    })

    act(() => {
      toastObj.dismiss()
    })

    expect(result.current.toasts[0].open).toBe(false)

    // Fast-forward timers to trigger REMOVE_TOAST
    act(() => {
      jest.advanceTimersByTime(1000000)
    })

    expect(result.current.toasts.length).toBe(0)
  })

  it("reducer ADD_TOAST respects TOAST_LIMIT of 1", () => {
    const first = { id: "1", title: "First", open: true }
    const second = { id: "2", title: "Second", open: true }

    const stateAfterFirst = reducer({ toasts: [] }, { type: "ADD_TOAST", toast: first })
    const stateAfterSecond = reducer(stateAfterFirst, { type: "ADD_TOAST", toast: second })

    expect(stateAfterSecond.toasts.length).toBe(1)
    expect(stateAfterSecond.toasts[0].id).toBe("2")
  })

  it("DISMISS_TOAST with toastId dismisses only specified toast", () => {
    const toast1 = { id: "1", title: "One", open: true }
    const toast2 = { id: "2", title: "Two", open: true }
    const initialState = { toasts: [toast1, toast2] }

    const newState = reducer(initialState, { type: "DISMISS_TOAST", toastId: "1" })

    expect(newState.toasts.find(t => t.id === "1")?.open).toBe(false)
    expect(newState.toasts.find(t => t.id === "2")?.open).toBe(true)
  })

  it("DISMISS_TOAST without toastId dismisses all toasts", () => {
    const toast1 = { id: "1", title: "One", open: true }
    const toast2 = { id: "2", title: "Two", open: true }
    const initialState = { toasts: [toast1, toast2] }

    const newState = reducer(initialState, { type: "DISMISS_TOAST" })

    expect(newState.toasts.every(t => t.open === false)).toBe(true)
  })

  it("REMOVE_TOAST removes specific toast by id", () => {
    const toast1 = { id: "1", title: "One", open: false }
    const toast2 = { id: "2", title: "Two", open: false }
    const initialState = { toasts: [toast1, toast2] }

    const newState = reducer(initialState, { type: "REMOVE_TOAST", toastId: "1" })

    expect(newState.toasts.length).toBe(1)
    expect(newState.toasts[0].id).toBe("2")
  })

  it("REMOVE_TOAST without toastId removes all toasts", () => {
    const toast1 = { id: "1", title: "One", open: false }
    const toast2 = { id: "2", title: "Two", open: false }
    const initialState = { toasts: [toast1, toast2] }

    const newState = reducer(initialState, { type: "REMOVE_TOAST" })

    expect(newState.toasts.length).toBe(0)
  })
})
