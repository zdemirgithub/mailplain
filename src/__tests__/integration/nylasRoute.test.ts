import { GET } from "@/app/api/auth/callback/nylas/route";
import { nylas } from "@/lib/nylas";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

jest.mock("@/lib/nylas");
jest.mock("@/server/db");
jest.mock("next/headers", () => ({
  cookies: () => ({
    get: jest.fn(),
  }),
}));

describe("Nylas OAuth2 callback GET handler", () => {
  const mockCookiesGet = jest.fn();
  const userId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    // Override cookies().get to use our mock
    jest.spyOn(require("next/headers"), "cookies").mockImplementation(() => ({
      get: mockCookiesGet,
    }));
  });

  function createRequest(url: string) {
    return new Request(url);
  }

  it("returns 400 if no userId cookie", async () => {
    mockCookiesGet.mockReturnValue(undefined);

    const req = createRequest("http://localhost/api/auth/callback/nylas?code=abc");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("No user ID found");
  });

  it("returns 400 if no code query param", async () => {
    mockCookiesGet.mockReturnValue({ value: userId });

    const req = createRequest("http://localhost/api/auth/callback/nylas");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("No authorization code returned from Nylas");
  });

  it("returns 500 if exchangeCodeForToken throws", async () => {
    mockCookiesGet.mockReturnValue({ value: userId });
    (nylas.auth.exchangeCodeForToken as jest.Mock).mockRejectedValue(new Error("fail"));

    const req = createRequest("http://localhost/api/auth/callback/nylas?code=abc");
    const res = await GET(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to exchange authorization code for token");
  });

  it("creates grant and returns success message", async () => {
    mockCookiesGet.mockReturnValue({ value: userId });

    const fakeGrantId = "grant-123";
    (nylas.auth.exchangeCodeForToken as jest.Mock).mockResolvedValue({
      grantId: fakeGrantId,
    });

    const createMock = jest.fn().mockResolvedValue({});
    (db.grant.create as jest.Mock) = createMock;

    const req = createRequest("http://localhost/api/auth/callback/nylas?code=abc");
    const res = await GET(req);

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: fakeGrantId,
          userId,
          token: expect.any(String),
        }),
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("OAuth2 flow completed successfully for grant ID:");
  });
});
