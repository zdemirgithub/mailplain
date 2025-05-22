import { POST } from "@/app/api/completion/route";
import { openai } from "@ai-sdk/openai";
import { OpenAIStream, StreamingTextResponse } from "ai";

jest.mock("@ai-sdk/openai");
jest.mock("ai");

describe("POST /api/completion", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("streams completion response for valid prompt", async () => {
    const mockStream = {};
    (openai.createChatCompletion as jest.Mock).mockResolvedValue("mockResponse");
    (OpenAIStream as jest.Mock).mockReturnValue(mockStream);
    (StreamingTextResponse as jest.Mock).mockImplementation((stream) => ({
      stream,
      status: 200,
      headers: new Headers({ "Content-Type": "text/event-stream" }),
    }));

    const req = new Request("http://localhost/api/completion", {
      method: "POST",
      body: JSON.stringify({ prompt: "Hello world" }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);

    expect(openai.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-3.5-turbo",
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("##Hello world##"),
          }),
        ]),
        stream: true,
      })
    );

    expect(OpenAIStream).toHaveBeenCalledWith("mockResponse");
    expect(StreamingTextResponse).toHaveBeenCalledWith(mockStream);

    // You can check the response shape if needed:
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("handles missing prompt gracefully", async () => {
    const req = new Request("http://localhost/api/completion", {
      method: "POST",
      body: JSON.stringify({}), // no prompt
      headers: { "Content-Type": "application/json" },
    });

    await expect(POST(req)).rejects.toThrow();
  });
});
