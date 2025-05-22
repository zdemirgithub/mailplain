import { handler } from "@/app/api/trpc/[trpc]/route";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

jest.mock("@/server/api/trpc", () => ({
  createTRPCContext: jest.fn(),
}));

describe("tRPC handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createMockRequest(method = "GET", headers = {}) {
    return new Request("http://localhost/api/trpc", { method, headers });
  }

  it("handles a valid GET request", async () => {
    (createTRPCContext as jest.Mock).mockResolvedValue({ some: "context" });

    const req = createMockRequest();
    const res = await handler(req);

    // The response should be a Response object (fetch API)
    expect(res).toBeInstanceOf(Response);

    // Since it's an empty call, probably 200 but depends on your router
    expect(res.status).toBe(200);
  });

  it("calls onError logger in development on failure", async () => {
    // Simulate NODE_ENV = development
    process.env.NODE_ENV = "development";

    // Mock context creation to throw an error to trigger onError
    (createTRPCContext as jest.Mock).mockImplementation(() => {
      throw new Error("Test error");
    });

    // Spy on console.error
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const req = createMockRequest();
    try {
      await handler(req);
    } catch {
      // handler may throw if context creation fails
    }

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("❌ tRPC failed on"),
      expect.stringContaining("Test error")
    );

    consoleErrorSpy.mockRestore();

    // Reset NODE_ENV after test
    process.env.NODE_ENV = undefined;
  });
});
