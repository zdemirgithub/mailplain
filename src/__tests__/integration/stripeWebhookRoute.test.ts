import { POST } from "@/app/api/stripe/webhook/route";
import { stripe } from "@/lib/stripe";
import { db } from "@/server/db";
import { NextResponse } from "next/server";

jest.mock("@/lib/stripe");
jest.mock("@/server/db");
jest.mock("next/headers", () => ({
  headers: () => ({
    get: jest.fn(),
  }),
}));

describe("Stripe webhook POST handler", () => {
  const headers = require("next/headers");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validBody = JSON.stringify({ some: "payload" });
  const validSignature = "valid_signature";

  // Helper to mock stripe.webhooks.constructEvent
  function mockConstructEvent(event: any) {
    (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(event);
  }

  it("returns 400 on webhook signature verification failure", async () => {
    (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid signature");
    });
    (headers.headers().get as jest.Mock).mockReturnValue(validSignature);

    const req = new Request("http://localhost", {
      method: "POST",
      body: validBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles checkout.session.completed event", async () => {
    const session = {
      subscription: "sub_123",
      client_reference_id: "user_abc",
    };
    const event = {
      type: "checkout.session.completed",
      data: { object: session },
    };

    mockConstructEvent(event);
    (headers.headers().get as jest.Mock).mockReturnValue(validSignature);

    // Mock stripe.subscriptions.retrieve
    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: "sub_123",
      current_period_end: 1680000000,
      customer: "cus_456",
      items: {
        data: [
          {
            price: {
              id: "price_789",
              product: { id: "prod_101112" },
            },
          },
        ],
      },
    });

    // Mock db create
    (db.stripeSubscription.create as jest.Mock).mockResolvedValue(true);

    const req = new Request("http://localhost", {
      method: "POST",
      body: validBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: "success" });

    expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith("sub_123", { expand: ["items.data.price.product"] });
    expect(db.stripeSubscription.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subscriptionId: "sub_123",
        productId: "prod_101112",
        priceId: "price_789",
        customerId: "cus_456",
        userId: "user_abc",
        currentPeriodEnd: new Date(1680000000 * 1000),
      }),
    });
  });

  it("returns 400 if client_reference_id is missing in checkout.session.completed", async () => {
    const session = {
      subscription: "sub_123",
    };
    const event = {
      type: "checkout.session.completed",
      data: { object: session },
    };

    mockConstructEvent(event);
    (headers.headers().get as jest.Mock).mockReturnValue(validSignature);

    const req = new Request("http://localhost", {
      method: "POST",
      body: validBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles invoice.payment_succeeded event", async () => {
    const session = {
      subscription: "sub_456",
    };
    const event = {
      type: "invoice.payment_succeeded",
      data: { object: session },
    };

    mockConstructEvent(event);
    (headers.headers().get as jest.Mock).mockReturnValue(validSignature);

    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      id: "sub_456",
      current_period_end: 1681111111,
      items: {
        data: [
          {
            price: {
              id: "price_abc",
              product: { id: "prod_def" },
            },
          },
        ],
      },
    });

    (db.stripeSubscription.update as jest.Mock).mockResolvedValue(true);

    const req = new Request("http://localhost", {
      method: "POST",
      body: validBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: "success" });

    expect(db.stripeSubscription.update).toHaveBeenCalledWith({
      where: { subscriptionId: "sub_456" },
      data: {
        currentPeriodEnd: new Date(1681111111 * 1000),
        productId: "prod_def",
        priceId: "price_abc",
      },
    });
  });

  it("handles customer.subscription.updated event", async () => {
    const session = {
      id: "sub_789",
    };
    const event = {
      type: "customer.subscription.updated",
      data: { object: session },
    };

    mockConstructEvent(event);
    (headers.headers().get as jest.Mock).mockReturnValue(validSignature);

    (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
      current_period_end: 1682222222,
    });

    (db.stripeSubscription.update as jest.Mock).mockResolvedValue(true);

    const req = new Request("http://localhost", {
      method: "POST",
      body: validBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: "success" });

    expect(db.stripeSubscription.update).toHaveBeenCalledWith({
      where: { subscriptionId: "sub_789" },
      data: {
        updatedAt: expect.any(Date),
        currentPeriodEnd: new Date(1682222222 * 1000),
      },
    });
  });

  it("returns 200 for unknown event types", async () => {
    const event = {
      type: "some.other.event",
      data: { object: {} },
    };

    mockConstructEvent(event);
    (headers.headers().get as jest.Mock).mockReturnValue(validSignature);

    const req = new Request("http://localhost", {
      method: "POST",
      body: validBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: "success" });
  });
});
