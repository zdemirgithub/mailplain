import { renderHook, act } from "@testing-library/react"
import { useThread } from "./use-thread"
import { Provider } from "jotai"

// Wrap hook in Jotai Provider to support atoms
const wrapper = ({ children }: { children: React.ReactNode }) => <Provider>{children}</Provider>

describe("useThread hook", () => {
  it("should initialize with null", () => {
    const { result } = renderHook(() => useThread(), { wrapper })

    const [thread] = result.current
    expect(thread).toBeNull()
  })

  it("should update the atom value", () => {
    const { result } = renderHook(() => useThread(), { wrapper })

    act(() => {
      const [, setThread] = result.current
      setThread("thread-123")
    })

    const [updatedThread] = result.current
    expect(updatedThread).toBe("thread-123")
  })

  it("should reset value to null", () => {
    const { result } = renderHook(() => useThread(), { wrapper })

    act(() => {
      const [, setThread] = result.current
      setThread("thread-abc")
    })

    act(() => {
      const [, setThread] = result.current
      setThread(null)
    })

    const [finalThread] = result.current
    expect(finalThread).toBeNull()
  })
})
