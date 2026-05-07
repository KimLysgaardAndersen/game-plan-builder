import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const InputSchema = z.object({
  systemPrompt: z.string(),
  messages: z.array(MessageSchema).max(40),
});

export const replyAsDebtor = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { reply: "(AI ikke konfigureret — sæt LOVABLE_API_KEY)", verdict: "continue" as const };
    }

    const messages = [
      { role: "system", content: data.systemPrompt },
      ...data.messages,
      {
        role: "system",
        content:
          "Reply ONLY with valid JSON: {\"reply\": string in Danish (1-3 sentences), \"verdict\": one of \"continue\" | \"agreed\" | \"refused\"}. Use \"agreed\" only if you accept a concrete payment arrangement. Use \"refused\" if you angrily end the call.",
      },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Lovable AI error", res.status, text);
      return { reply: "(Forbindelsesfejl til AI)", verdict: "continue" as const };
    }
    const json: any = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(raw);
      const verdict =
        parsed.verdict === "agreed" || parsed.verdict === "refused" ? parsed.verdict : "continue";
      return { reply: String(parsed.reply ?? ""), verdict: verdict as "continue" | "agreed" | "refused" };
    } catch {
      return { reply: String(raw), verdict: "continue" as const };
    }
  });