import { GET } from "@/app/api/aurinko/callback/route";
import { auth } from "@clerk/nextjs/server";
import { getAurinkoToken, getAccountDetails } from "@/lib/aurinko";
import { db } from "@/server/db";
import axios from "axios";
import { waitUntil } from "@vercel/functions";
import { NextRequest } from "next/server";

jest.mock("@clerk/nextjs/server");
jest.mock("@/lib/aurinko");
jest.mock("@/server/db");
jest.mock("axios");
jest.mock("@vercel/functions", () => ({
  waitUntil: jest.fn(),
}));

describe("Aurinko callback GET handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUserId = "user-123";
  const baseUrl = "http://localhost/api/aurinko/callback";

  function createRequest(url: string) {
    return new NextRequest(url);
  }

  it("returns 401 if user is not authenticated", async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: null });

    const req = createRequest(`${baseUrl}?status=success&code=abc`);
    const res = await GET(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("UNAUTHORIZED");
  });

  it("returns 400 if status param is not success", async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });

    const req = createRequest(`${baseUrl}?status=fail&code=abc`);
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Account connection failed");
  });

  it("returns 400 if token fetch fails", async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
    (getAurinkoToken as jest.Mock).mockResolvedValue(null);

    const req = createRequest(`${baseUrl}?status=success&code=abc`);
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Failed to fetch token");
  });

  it("upserts account and redirects on success", async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: mockUserId });
    (getAurinkoToken as jest.Mock).mockResolvedValue({
      accessToken: "token-xyz",
      accountId: 42,
    });
    (getAccountDetails as jest.Mock).mockResolvedValue({
      email: "test@example.com",
      name: "Test User",
    });

    const upsertMock = jest.fn().mockResolvedValue({});
    (db.account.upsert as jest.Mock) = upsertMock;

    (axios.post as jest.Mock).mockResolvedValue({ data: "ok" });

    const req = createRequest(`${baseUrl}?status=success&code=abc`);
    const res = await GET(req);

    expect(upsertMock).toHaveBeenCalledWith({
      where: { id: "42" },
      create: {
        id: "42",
        userId: mockUserId,
        token: "token-xyz",
        provider: "Aurinko",
        emailAddress: "test@example.com",
        name: "Test User",
      },
      update: {
        token: "token-xyz",
      },
    });

    expect(waitUntil).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_URL}/api/initial-sync`,
      { accountId: "42", userId: mockUserId }
    );

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/mail");
  });
});
