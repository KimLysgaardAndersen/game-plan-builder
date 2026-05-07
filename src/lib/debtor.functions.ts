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
          'Reply ONLY with valid JSON: {"reply": string in Danish (1-3 sentences), "verdict": "continue" | "agreed" | "refused" | "hangup", "monthlyAmount": number, "lumpSum": number, "proposedMonthly": number, "proposedLump": number}. RULES: (1) If you ACCEPT an offer, set verdict="agreed" and put the agreed amount in monthlyAmount/lumpSum. (2) If YOU (the debtor) propose or counter with a concrete number, set verdict="continue" and put your proposal in proposedMonthly/proposedLump. (3) Use "refused" only if you calmly but firmly say no to a final offer. (4) Use "hangup" if the collector is rude, threatening, condescending, presses too hard, or repeatedly ignores your situation — your reply should be a short angry line and then *lægger på* / *afbryder samtalen*. Pressure-cards like inkasso/foged/gebyr/RKI used too aggressively or stacked early MUST trigger hangup if your character is anxious, elderly, or vulnerable. (5) If the collector\'s last message starts with "FORSLAG:", you MUST accept, counter, or refuse — not stall. (6) Stay in character: an angry debtor hangs up faster; an arrogant one mocks before hanging up; an elderly one panics. Set unused fields to 0.',
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
        parsed.verdict === "agreed" || parsed.verdict === "refused" || parsed.verdict === "hangup"
          ? parsed.verdict
          : "continue";
      return {
        reply: String(parsed.reply ?? ""),
        verdict: verdict as "continue" | "agreed" | "refused" | "hangup",
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

// ============= Dynamic adaptive cards =============

const DynamicCardsSchema = z.object({
  transcript: z
    .array(z.object({ role: z.enum(["collector", "debtor"]), text: z.string() }))
    .max(40),
  collectorTrait: z.string(),
  collectorName: z.string(),
  debtorName: z.string(),
});

const ALLOWED_ICONS = [
  "Mail","Coins","Handshake","Landmark","AlertTriangle","Gavel","ShieldAlert",
  "Heart","Ear","HelpCircle","FileText","Wallet","Clock","CreditCard",
  "Calculator","AlertOctagon","Timer","Scale","ThumbsUp","ListChecks",
] as const;

export const suggestDynamicCards = createServerFn({ method: "POST" })
  .inputValidator((data) => DynamicCardsSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    const fallback = {
      cards: [
        {
          id: "dyn-listen",
          title: "Spørg ind",
          effect: "Stil et åbent spørgsmål",
          cost: 0,
          icon: "Ear",
          prompt: "Fortæl mig lige lidt mere om hvordan din situation ser ud lige nu.",
        },
        {
          id: "dyn-offer",
          title: "Læg et tal",
          effect: "Foreslå et konkret beløb",
          cost: 1,
          icon: "ListChecks",
          prompt: "Hvad siger du til at vi finder et månedligt beløb der passer dig?",
        },
      ],
    };
    if (!apiKey) return fallback;

    const transcriptText = data.transcript
      .map((m) => `${m.role === "collector" ? data.collectorName : data.debtorName}: ${m.text}`)
      .join("\n");

    const sys = `You generate 2 NEW Danish action cards for a debt-collection training game. The cards must fit the COLLECTOR's personality (${data.collectorTrait}) and react to what just happened in the conversation. Each card is a concrete line the collector can say. Vary tone: one slightly more pressing, one slightly softer. Keep prompts 1-2 sentences in DANISH. Reply ONLY with valid JSON: {"cards":[{"title":string (max 3 words, Danish),"effect":string (max 6 words, Danish),"cost":number (0-3),"icon":one of ${ALLOWED_ICONS.join("|")},"prompt":string (Danish, 1-2 sentences)}]}. Exactly 2 cards.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: `Samtale indtil nu:\n${transcriptText}\n\nLav 2 nye kort.` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return fallback;
    const json: any = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    try {
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed?.cards) ? parsed.cards.slice(0, 2) : [];
      const cards = arr.map((c: any, i: number) => ({
        id: `dyn-${Date.now()}-${i}`,
        title: String(c.title ?? "Replik").slice(0, 24),
        effect: String(c.effect ?? "Tilpasset replik").slice(0, 40),
        cost: Math.max(0, Math.min(3, Number(c.cost) || 0)),
        icon: (ALLOWED_ICONS as readonly string[]).includes(String(c.icon)) ? String(c.icon) : "Sparkles",
        prompt: String(c.prompt ?? "..."),
      }));
      if (cards.length < 2) return fallback;
      return { cards };
    } catch {
      return fallback;
    }
  });