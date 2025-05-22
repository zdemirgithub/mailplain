import { POST } from "@/app/api/initial-sync/route";
import Account from "@/lib/account";
import { syncEmailsToDatabase } from "@/lib/sync-to-db";
import { db } from "@/server/db";
import { NextRequest } from "next/server";

jest.mock("@/lib/account");
jest.mock("@/lib/sync-to-db");
jest.mock("@/server/db");

describe("POST /api/initial-sync", () => {
  const mockAccountId = "acc123";
  const mockUserId = "user456";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRequest(body: any) {
    return new Request("http://localhost/api/initial-sync", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  it("returns 400 if missing accountId or userId", async () => {
    let res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    res = await POST(createRequest({ accountId: mockAccountId }));
    expect(res.status).toBe(400);
  });

  it("returns 404 if account not found", async () => {
    (db.account.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await POST(createRequest({ accountId: mockAccountId, userId: mockUserId }));
    expect(res.status).toBe(404);
  });

  it("returns 500 if performInitialSync fails", async () => {
    (db.account.findUnique as jest.Mock).mockResolvedValue({ id: mockAccountId, userId: mockUserId, token: "token123" });
    (Account as jest.Mock).mockImplementation(() => ({
      createSubscription: jest.fn().mockResolvedValue(true),
      performInitialSync: jest.fn().mockResolvedValue(null), // failure here
    }));

    const res = await POST(createRequest({ accountId: mockAccountId, userId: mockUserId }));
    expect(res.status).toBe(500);
  });

  it("syncs emails and updates account successfully", async () => {
    const mockDeltaToken = "delta-token-xyz";
    const mockEmails = [{ id: "email1" }, { id: "email2" }];

    (db.account.findUnique as jest.Mock).mockResolvedValue({
      id: mockAccountId,
      userId: mockUserId,
      token: "token123",
    });
    (Account as jest.Mock).mockImplementation(() => ({
      createSubscription: jest.fn().mockResolvedValue(true),
      performInitialSync: jest.fn().mockResolvedValue({
        deltaToken: mockDeltaToken,
        emails: mockEmails,
      }),
    }));
    (syncEmailsToDatabase as jest.Mock).mockResolvedValue(true);
    (db.account.update as jest.Mock).mockResolvedValue(true);

    const res = await POST(createRequest({ accountId: mockAccountId, userId: mockUserId }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true, deltaToken: mockDeltaToken });

    expect(syncEmailsToDatabase).toHaveBeenCalledWith(mockEmails, mockAccountId);
    expect(db.account.update).toHaveBeenCalledWith({
      where: { token: "token123" },
      data: { nextDeltaToken: mockDeltaToken },
    });
  });
});
