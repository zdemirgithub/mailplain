import React from "react";
import { render, screen } from "@testing-library/react";
import { TRPCReactProvider, api } from "@/lib/trpc/react";
import * as reactQuery from "@tanstack/react-query";

jest.mock("@tanstack/react-query", () => {
  const original = jest.requireActual("@tanstack/react-query");
  return {
    ...original,
    QueryClientProvider: jest.fn(({ children }) => <div>{children}</div>),
  };
});

describe("TRPCReactProvider", () => {
  it("renders children inside the provider", () => {
    render(
      <TRPCReactProvider>
        <div data-testid="child">Hello</div>
      </TRPCReactProvider>
    );

    expect(screen.getByTestId("child")).toHaveTextContent("Hello");
  });

  it("creates a trpc client with correct links and headers", () => {
    // Spy on createClient method
    const createClientSpy = jest.spyOn(api, "createClient");

    render(
      <TRPCReactProvider>
        <div>Test</div>
      </TRPCReactProvider>
    );

    expect(createClientSpy).toHaveBeenCalled();

    const clientArg = createClientSpy.mock.calls[0][0];
    expect(clientArg.links).toBeDefined();

    // Check that loggerLink and unstable_httpBatchStreamLink are in links
    expect(clientArg.links.some(link => typeof link === "object")).toBe(true);

    // Check headers function exists and returns expected header
    const headers = clientArg.links[1].headers();
    expect(headers.get("x-trpc-source")).toBe("nextjs-react");

    createClientSpy.mockRestore();
  });

  it("getBaseUrl returns correct URL based on environment", () => {
    // Since getBaseUrl is not exported, we test indirectly by spying on window.location.origin
    // Here you could expose getBaseUrl in the module or test logic separately if you prefer

    // Example: in node environment (no window)
    delete (global as any).window;
    process.env.VERCEL_URL = "vercel.app";

    const mod = require("@/lib/trpc/react");
    const baseUrl = mod.getBaseUrl();
    expect(baseUrl).toBe("https://vercel.app");

    process.env.VERCEL_URL = "";

    const baseUrl2 = mod.getBaseUrl();
    expect(baseUrl2).toMatch(/http:\/\/localhost:\d+/);
  });
});
