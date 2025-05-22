import { POST } from "@/app/api/chat/route";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { getSubscriptionStatus } from "@/lib/stripe-actions";
import { OramaManager } from "@/lib/orama";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { OpenAIApi } from "openai-edge";

jest.mock("@clerk/nextjs/server");
jest.mock("@/server/db");
jest.mock("@/lib/stripe-actions");
jest.mock("@/lib/orama");
jest.mock("openai-edge");
jest.mock("ai");

describe("POST /api/chat", () => {
  const userId = "user-123";
  const accountId = "account-456";
  const messages = [
    { role: "user", content: "Hello" },
    { role: "assistant", content: "Hi there" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createRequest(body: any) {
    return new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  it("returns 401 if unauthorized", async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: null });

    const req = createRequest({ messages, accountId });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 429 if free user hits limit", async () => {
    (auth as jest.Mock).mockResolvedValue({ userId });
    (getSubscriptionStatus as jest.Mock).mockResolvedValue(false);

    (db.chatbotInteraction.findUnique as jest.Mock).mockResolvedValue({
      count: 10, // equals FREE_CREDITS_PER_DAY
      day: new Date().toDateString(),
      userId,
    });

    const req = createRequest({ messages, accountId });
    const res = await POST(req);

    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe("Limit reached");
  });

  it("creates interaction if none exists for free user", async () => {
    (auth as jest.Mock).mockResolvedValue({ userId });
    (getSubscriptionStatus as jest.Mock).mockResolvedValue(false);

    (db.chatbotInteraction.findUnique as jest.Mock).mockResolvedValue(null);
    (db.chatbotInteraction.create as jest.Mock).mockResolvedValue({});

    (OramaManager.prototype.initialize as jest.Mock).mockResolvedValue(undefined);
    (OramaManager.prototype.vectorSearch as jest.Mock).mockResolvedValue({ hits: [] });

    (OpenAIApi.prototype.createChatCompletion as jest.Mock).mockResolvedValue("mockResponse");
    (OpenAIStream as jest.Mock).mockReturnValue("stream");
    (StreamingTextResponse as jest.Mock).mockImplementation((stream) => ({ stream }));

    const req = createRequest({ messages, accountId });
    const res = await POST(req);

    expect(db.chatbotInteraction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId,
          count: 1,
          day: expect.any(String),
        }),
      })
    );

    expect(res).toHaveProperty("stream");
  });

  it("increments count for free user under limit", async () => {
    (auth as jest.Mock).mockResolvedValue({ userId });
    (getSubscriptionStatus as jest.Mock).mockResolvedValue(false);

    (db.chatbotInteraction.findUnique as jest.Mock).mockResolvedValue({
      count: 1,
      day: new Date().toDateString(),
      userId,
    });
    (db.chatbotInteraction.update as jest.Mock).mockResolvedValue({});

    (OramaManager.prototype.initialize as jest.Mock).mockResolvedValue(undefined);
    (OramaManager.prototype.vectorSearch as jest.Mock).mockResolvedValue({ hits: [] });

    (OpenAIApi.prototype.createChatCompletion as jest.Mock).mockResolvedValue("mockResponse");
    (OpenAIStream as jest.Mock).mockReturnValue("stream");
    (StreamingTextResponse as jest.Mock).mockImplementation((stream) => ({ stream }));

    const req = createRequest({ messages, accountId });
    const res = await POST(req);

    expect(db.chatbotInteraction.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId,
          day: expect.any(String),
        },
        data: {
          count: { increment: 1 },
        },
      })
    );
    expect(res).toHaveProperty("stream");
  });

  it("does not limit subscribed users", async () => {
    (auth as jest.Mock).mockResolvedValue({ userId });
    (getSubscriptionStatus as jest.Mock).mockResolvedValue(true);

    (OramaManager.prototype.initialize as jest.Mock).mockResolvedValue(undefined);
    (OramaManager.prototype.vectorSearch as jest.Mock).mockResolvedValue({ hits: [] });

    (OpenAIApi.prototype.createChatCompletion as jest.Mock).mockResolvedValue("mockResponse");
    (OpenAIStream as jest.Mock).mockReturnValue("stream");
    (StreamingTextResponse as jest.Mock).mockImplementation((stream) => ({ stream }));

    const req = createRequest({ messages, accountId });
    const res = await POST(req);

    // Should NOT call db.chatbotInteraction.findUnique or update/create for subscribed user
    expect(db.chatbotInteraction.findUnique).not.toHaveBeenCalled();

    expect(res).toHaveProperty("stream");
  });

  it("returns 500 on error", async () => {
    (auth as jest.Mock).mockRejectedValue(new Error("fail"));

    const req = createRequest({ messages, accountId });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("error");
  });
});
