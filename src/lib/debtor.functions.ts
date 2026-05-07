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
      return {
        reply: "(AI ikke konfigureret — sæt LOVABLE_API_KEY)",
        verdict: "continue" as const,
        monthlyAmount: 0,
        lumpSum: 0,
        proposedMonthly: 0,
        proposedLump: 0,
      };
    }

    const messages = [
      { role: "system", content: data.systemPrompt },
      ...data.messages,
      {
        role: "system",
        content:
          'Reply ONLY with valid JSON: {"reply": string in Danish (1-3 sentences), "verdict": "continue" | "agreed" | "refused", "monthlyAmount": number, "lumpSum": number, "proposedMonthly": number, "proposedLump": number}. RULES: (1) If you ACCEPT, set verdict="agreed" and put the agreed amount in monthlyAmount/lumpSum. (2) If YOU (the debtor) propose or counter with a concrete number, set verdict="continue" and put your proposal in proposedMonthly/proposedLump (so the collector can accept it). (3) Use "refused" only if you angrily hang up. (4) If the collector\'s last message starts with "FORSLAG:", you MUST accept, counter, or refuse — not stall. Accept offers that fit your character\'s realistic ability to pay. Set unused fields to 0.',
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
      return { reply: "(Forbindelsesfejl til AI)", verdict: "continue" as const, monthlyAmount: 0, lumpSum: 0, proposedMonthly: 0, proposedLump: 0 };
    }
    const json: any = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(raw);
      const verdict =
        parsed.verdict === "agreed" || parsed.verdict === "refused" ? parsed.verdict : "continue";
      return {
        reply: String(parsed.reply ?? ""),
        verdict: verdict as "continue" | "agreed" | "refused",
        monthlyAmount: Number(parsed.monthlyAmount) || 0,
        lumpSum: Number(parsed.lumpSum) || 0,
        proposedMonthly: Number(parsed.proposedMonthly) || 0,
        proposedLump: Number(parsed.proposedLump) || 0,
      };
    } catch {
      return { reply: String(raw), verdict: "continue" as const, monthlyAmount: 0, lumpSum: 0, proposedMonthly: 0, proposedLump: 0 };
    }
  });

// ============= Coach debrief =============

const DebriefSchema = z.object({
  transcript: z.array(z.object({ role: z.enum(["collector", "debtor"]), text: z.string() })).max(40),
  outcome: z.enum(["win", "partial", "lose"]),
  failedObjectives: z.array(z.string()).max(10),
  levelTitle: z.string(),
});

export const coachDebrief = createServerFn({ method: "POST" })
  .inputValidator((data) => DebriefSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { feedback: "Coach utilgængelig." };

    const transcriptText = data.transcript
      .map((m) => `${m.role === "collector" ? "Inkassator" : "Debitor"}: ${m.text}`)
      .join("\n");

    const prompt = `Du er en erfaren inkasso-coach på dansk. En trainee spillede banen "${data.levelTitle}" og fik resultatet "${data.outcome}". Mål der ikke blev opfyldt: ${data.failedObjectives.join(", ") || "ingen"}.\n\nUDSKRIFT:\n${transcriptText}\n\nGiv en kort, konkret feedback (max 4 sætninger) på dansk: hvad gik godt, hvad gik galt, og ét konkret råd til næste forsøg. Ingen overskrifter, kun selve teksten.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return { feedback: "Coach utilgængelig lige nu." };
    const json: any = await res.json();
    return { feedback: String(json?.choices?.[0]?.message?.content ?? "").trim() };
  });