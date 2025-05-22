import { POST } from "@/app/api/aurinko/webhook/route";
import { NextRequest } from "next/server";
import crypto from "crypto";

jest.mock("@/lib/account");
jest.mock("@/server/db");
jest.mock("@vercel/functions", () => ({
  waitUntil: jest.fn(),
}));

import Account from "@/lib/account";
import { db } from "@/server/db";
import { waitUntil } from "@vercel/functions";

describe("Aurinko webhook POST handler", () => {
  const secret = "test_secret";
  process.env.AURINKO_SIGNING_SECRET = secret;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRequest(body: string, timestamp: string, secretKey: string) {
    const basestring = `v0:${timestamp}:${body}`;
    const signature = crypto
      .createHmac("sha256", secretKey)
      .update(basestring)
      .digest("hex");

    return new NextRequest("http://localhost/api/aurinko/webhook", {
      method: "POST",
      headers: {
        "X-Aurinko-Request-Timestamp": timestamp,
        "X-Aurinko-Signature": signature,
        "Content-Type": "application/json",
      },
      body,
    });
  }

  it("returns 200 with validationToken if present", async () => {
    const req = new NextRequest(
      "http://localhost/api/aurinko/webhook?validationToken=abc123",
      { method: "POST" }
    );

    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("abc123");
  });

  it("returns 400 if missing headers or body", async () => {
    const req = new NextRequest("http://localhost/api/aurinko/webhook", {
      method: "POST",
      headers: {},
      body: null,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 if signature is invalid", async () => {
    const req = new NextRequest("http://localhost/api/aurinko/webhook", {
      method: "POST",
      headers: {
        "X-Aurinko-Request-Timestamp": "123",
        "X-Aurinko-Signature": "invalidsig",
      },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 404 if account not found", async () => {
    const payload = {
      subscription: 1,
      resource: "resource",
      accountId: 42,
      payloads: [],
    };
    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();

    // Mock db.account.findUnique to return null
    (db.account.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createRequest(body, timestamp, secret);

    const res = await POST(req);

    expect(res.status).toBe(404);
  });

  it("calls Account.syncEmails and returns 200 for valid request", async () => {
    const payload = {
      subscription: 1,
      resource: "resource",
      accountId: 42,
      payloads: [],
    };
    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();

    // Mock db.account.findUnique to return an account with token
    (db.account.findUnique as jest.Mock).mockResolvedValue({
      id: "42",
      token: "valid_token",
    });

    // Mock Account class and its syncEmails method
    const mockSyncEmails = jest.fn().mockResolvedValue(undefined);
    (Account as jest.Mock).mockImplementation(() => ({
      syncEmails: mockSyncEmails,
    }));

    const req = createRequest(body, timestamp, secret);

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(Account).toHaveBeenCalledWith("valid_token");
    expect(waitUntil).toHaveBeenCalled();
    expect(mockSyncEmails).toHaveBeenCalled();
  });
});
