import { GET } from "@/app/api/stripe/checkout/route";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";

jest.mock("@/lib/stripe");
jest.mock("@/server/db");

describe("stripe/checkout GET handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseUrl = "http://localhost/api/stripe/checkout";

  function createRequestWithSessionId(sessionId?: string) {
    const url = new URL(baseUrl);
    if (sessionId) url.searchParams.set("session_id", sessionId);
    // Using the native Request API
    return new Request(url.toString());
  }

  it("redirects to /pricing if no session_id query param", async () => {
    const req = createRequestWithSessionId();
    const res = await GET(req);
    expect(res.status).toBe(307); // NextResponse.redirect uses 307 by default
    expect(res.headers.get("location")).toBe("/pricing");
  });

  it("processes a valid checkout session successfully and redirects to /mail", async () => {
    const sessionId = "sess_123";

    const mockSession = {
      customer: { id: "cus_123" },
      subscription: "sub_123",
      client_reference_id: "user_abc",
    };

    const mockSubscription = {
      id: "sub_123",
      items: {
        data: [
          {
            price: {
              id: "price_456",
              product: { id: "prod_789" },
            },
          },
        ],
      },
    };

    const mockUser = { id: "user_abc" };

    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue(mockSession);
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(mockSubscription);
    (db.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (db.stripeSubscription.create as jest.Mock).mockResolvedValue({});

    const req = createRequestWithSessionId(sessionId);
    const res = await GET(req);

    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith(sessionId, { expand: ['customer', 'subscription'] });
    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_123", { expand: ['items.data.price.product'] });
    expect(db.user.findUnique).toHaveBeenCalledWith({ where: { id: "user_abc" } });
    expect(db.stripeSubscription.create).toHaveBeenCalledWith({
      data: {
        subscriptionId: "sub_123",
        productId: "prod_789",
        priceId: "price_456",
        customerId: "cus_123",
        userId: "user_abc",
      },
    });

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/mail");
  });

  it("redirects to /error if customer data is invalid", async () => {
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      customer: "cus_123", // invalid, should be object
      subscription: "sub_123",
      client_reference_id: "user_abc",
    });

    const req = createRequestWithSessionId("sess_invalid");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/error");
  });

  it("redirects to /error if subscriptionId missing", async () => {
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      customer: { id: "cus_123" },
      subscription: undefined,
      client_reference_id: "user_abc",
    });

    const req = createRequestWithSessionId("sess_invalid");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/error");
  });

  it("redirects to /error if no user found", async () => {
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      customer: { id: "cus_123" },
      subscription: "sub_123",
      client_reference_id: "user_abc",
    });

    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: "sub_123",
      items: {
        data: [
          {
            price: {
              id: "price_456",
              product: { id: "prod_789" },
            },
          },
        ],
      },
    });

    (db.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createRequestWithSessionId("sess_123");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/error");
  });

  it("redirects to /error on any thrown error", async () => {
    (stripe.checkout.sessions.retrieve as jest.Mock).mockRejectedValue(new Error("Unexpected error"));

    const req = createRequestWithSessionId("sess_123");
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("/error");
  });
});
