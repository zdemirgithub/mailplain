import { createQueryClient } from "@/lib/trpc/query-client";
import { QueryClient } from "@tanstack/react-query";
import SuperJSON from "superjson";

describe("createQueryClient", () => {
  it("returns a QueryClient instance", () => {
    const qc = createQueryClient();
    expect(qc).toBeInstanceOf(QueryClient);
  });

  it("sets the default staleTime for queries", () => {
    const qc = createQueryClient();
    expect(qc.getDefaultOptions()?.queries?.staleTime).toBe(30 * 1000);
  });

  it("uses SuperJSON to serialize and deserialize data in dehydrate and hydrate options", () => {
    const qc = createQueryClient();

    // Access the internal default options
    const defaultOptions = qc.getDefaultOptions();

    expect(defaultOptions?.dehydrate?.serializeData).toBe(SuperJSON.serialize);
    expect(defaultOptions?.hydrate?.deserializeData).toBe(SuperJSON.deserialize);
  });

  it("shouldDehydrateQuery uses defaultShouldDehydrateQuery or pending status", () => {
    const qc = createQueryClient();
    const { shouldDehydrateQuery } = qc.getDefaultOptions()!.dehydrate!;

    // mock a query object with status pending
    const queryPending = {
      state: { status: "pending" },
    };
    expect(shouldDehydrateQuery(queryPending as any)).toBe(true);

    // mock a query object with status success and defaultShouldDehydrateQuery returning false
    const querySuccess = {
      state: { status: "success" },
    };
    // defaultShouldDehydrateQuery returns false, so shouldDehydrateQuery is false
    expect(shouldDehydrateQuery(querySuccess as any)).toBe(false);
  });
});
