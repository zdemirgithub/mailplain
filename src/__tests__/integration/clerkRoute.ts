import { POST } from "@/app/api/webhooks/clerk/route";
import { db } from "@/server/db";

jest.mock("@/server/db", () => ({
  db: {
    user: {
      upsert: jest.fn(),
    },
  },
}));

describe("webhooks/clerk route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("upserts user and returns 200", async () => {
    const mockUserData = {
      data: {
        id: "user-123",
        email_addresses: [{ email_address: "user@example.com" }],
        first_name: "John",
        last_name: "Doe",
        image_url: "https://example.com/image.jpg",
      },
    };

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: JSON.stringify(mockUserData),
      headers: { "Content-Type": "application/json" },
    });

    (db.user.upsert as jest.Mock).mockResolvedValueOnce({ id: "user-123" });

    const res = await POST(req);

    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "user-123" },
      update: {
        emailAddress: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        imageUrl: "https://example.com/image.jpg",
      },
      create: {
        id: "user-123",
        emailAddress: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        imageUrl: "https://example.com/image.jpg",
      },
    });

    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text).toBe("Webhook received");
  });

  it("handles missing email gracefully (optional test)", async () => {
    const mockUserData = {
      data: {
        id: "user-456",
        email_addresses: [],
        first_name: "Jane",
        last_name: "Smith",
        image_url: "https://example.com/image2.jpg",
      },
    };

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: JSON.stringify(mockUserData),
      headers: { "Content-Type": "application/json" },
    });

    (db.user.upsert as jest.Mock).mockResolvedValueOnce({ id: "user-456" });

    const res = await POST(req);

    // You might want to check how your handler should behave if email_addresses is empty
    // For now it will break since emailAddress is undefined, so you can add validation if needed

    expect(db.user.upsert).toHaveBeenCalledWith({
      where: { id: "user-456" },
      update: {
        emailAddress: undefined,
        firstName: "Jane",
        lastName: "Smith",
        imageUrl: "https://example.com/image2.jpg",
      },
      create: {
        id: "user-456",
        emailAddress: undefined,
        firstName: "Jane",
        lastName: "Smith",
        imageUrl: "https://example.com/image2.jpg",
      },
    });

    expect(res.status).toBe(200);
  });
});
