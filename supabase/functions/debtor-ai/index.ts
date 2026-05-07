import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedIcons = [
  "Mail",
  "Coins",
  "Handshake",
  "Landmark",
  "AlertTriangle",
  "Gavel",
  "ShieldAlert",
  "Heart",
  "Ear",
  "HelpCircle",
  "FileText",
  "Wallet",
  "Clock",
  "CreditCard",
  "Calculator",
  "AlertOctagon",
  "Timer",
  "Scale",
  "ThumbsUp",
  "ListChecks",
] as const;

type GatewayMessage = { role: "system" | "user" | "assistant"; content: string };

type DebtorReply = {
  reply: string;
  verdict: "continue" | "agreed" | "refused" | "hangup";
  monthlyAmount: number;
  lumpSum: number;
  proposedMonthly: number;
  proposedLump: number;
};

const debtorFallback: DebtorReply = {
  reply: "(Forbindelsesfejl til AI)",
  verdict: "continue",
  monthlyAmount: 0,
  lumpSum: 0,
  proposedMonthly: 0,
  proposedLump: 0,
};

const cardsFallback = {
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callLovableAi(body: Record<string, unknown>) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return { error: "Lovable AI er ikke konfigureret i backend.", status: 500 } as const;
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", ...body }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Lovable AI error", res.status, text);
    if (res.status === 429) return { error: "AI er midlertidigt rate-limited. Prøv igen om lidt.", status: 429 } as const;
    if (res.status === 402) return { error: "AI-kreditter er opbrugt i workspace.", status: 402 } as const;
    return { error: "Forbindelsesfejl til AI.", status: 502 } as const;
  }

  const json = await res.json();
  return { json } as const;
}

function safeString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function safeNumber(value: unknown) {
  return Number(value) || 0;
}

async function replyAsDebtor(payload: Record<string, unknown>) {
  const systemPrompt = safeString(payload.systemPrompt);
  const inputMessages = Array.isArray(payload.messages) ? payload.messages : [];
  const messages: GatewayMessage[] = [
    { role: "system", content: systemPrompt },
    ...inputMessages
      .slice(0, 40)
      .map((message) => {
        const m = message as Record<string, unknown>;
        const role = m.role === "user" || m.role === "assistant" || m.role === "system" ? m.role : "user";
        return { role, content: safeString(m.content) };
      }),
    {
      role: "system",
      content:
        'Reply ONLY with valid JSON: {"reply": string in Danish (1-3 sentences), "verdict": "continue" | "agreed" | "refused" | "hangup", "monthlyAmount": number, "lumpSum": number, "proposedMonthly": number, "proposedLump": number}. RULES: (1) If you ACCEPT an offer, set verdict="agreed" and put the agreed amount in monthlyAmount/lumpSum. (2) If YOU (the debtor) propose or counter with a concrete number, set verdict="continue" and put your proposal in proposedMonthly/proposedLump. (3) Use "refused" only if you calmly but firmly say no to a final offer. (4) Use "hangup" if the collector is rude, threatening, condescending, presses too hard, or repeatedly ignores your situation — your reply should be a short angry line and then *lægger på* / *afbryder samtalen*. Pressure-cards like inkasso/foged/gebyr/RKI used too aggressively or stacked early MUST trigger hangup if your character is anxious, elderly, or vulnerable. (5) If the collector\'s last message starts with "FORSLAG:", you MUST accept, counter, or refuse — not stall. (6) Stay in character: an angry debtor hangs up faster; an arrogant one mocks before hanging up; an elderly one panics. Set unused fields to 0.',
    },
  ];

  const result = await callLovableAi({ messages, response_format: { type: "json_object" } });
  if ("error" in result) return jsonResponse({ ...debtorFallback, reply: `(${result.error})` }, result.status);

  const raw = result.json?.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    const verdict = ["agreed", "refused", "hangup"].includes(parsed?.verdict) ? parsed.verdict : "continue";
    return jsonResponse({
      reply: safeString(parsed?.reply, "..."),
      verdict,
      monthlyAmount: safeNumber(parsed?.monthlyAmount),
      lumpSum: safeNumber(parsed?.lumpSum),
      proposedMonthly: safeNumber(parsed?.proposedMonthly),
      proposedLump: safeNumber(parsed?.proposedLump),
    });
  } catch {
    return jsonResponse({ ...debtorFallback, reply: safeString(raw, "...") });
  }
}

async function coachDebrief(payload: Record<string, unknown>) {
  const transcript = Array.isArray(payload.transcript) ? payload.transcript.slice(0, 40) : [];
  const transcriptText = transcript
    .map((message) => {
      const m = message as Record<string, unknown>;
      return `${m.role === "collector" ? "Inkassator" : "Debitor"}: ${safeString(m.text)}`;
    })
    .join("\n");
  const failed = Array.isArray(payload.failedObjectives) ? payload.failedObjectives.map((x) => safeString(x)).filter(Boolean) : [];
  const prompt = `Du er en erfaren inkasso-coach på dansk. En trainee spillede banen "${safeString(payload.levelTitle)}" og fik resultatet "${safeString(payload.outcome)}". Mål der ikke blev opfyldt: ${failed.join(", ") || "ingen"}.\n\nUDSKRIFT:\n${transcriptText}\n\nGiv en kort, konkret feedback (max 4 sætninger) på dansk: hvad gik godt, hvad gik galt, og ét konkret råd til næste forsøg. Ingen overskrifter, kun selve teksten.`;

  const result = await callLovableAi({ messages: [{ role: "user", content: prompt }] });
  if ("error" in result) return jsonResponse({ feedback: result.error }, result.status);
  return jsonResponse({ feedback: safeString(result.json?.choices?.[0]?.message?.content).trim() });
}

async function suggestDynamicCards(payload: Record<string, unknown>) {
  const transcript = Array.isArray(payload.transcript) ? payload.transcript.slice(0, 40) : [];
  const collectorName = safeString(payload.collectorName, "Inkassator");
  const debtorName = safeString(payload.debtorName, "Debitor");
  const transcriptText = transcript
    .map((message) => {
      const m = message as Record<string, unknown>;
      return `${m.role === "collector" ? collectorName : debtorName}: ${safeString(m.text)}`;
    })
    .join("\n");
  const system = `You generate 2 NEW Danish action cards for a debt-collection training game. The cards must fit the COLLECTOR's personality (${safeString(payload.collectorTrait)}) and react to what just happened in the conversation. Each card is a concrete line the collector can say. Vary tone: one slightly more pressing, one slightly softer. Keep prompts 1-2 sentences in DANISH. Reply ONLY with valid JSON: {"cards":[{"title":string (max 3 words, Danish),"effect":string (max 6 words, Danish),"cost":number (0-3),"icon":one of ${allowedIcons.join("|")},"prompt":string (Danish, 1-2 sentences)}]}. Exactly 2 cards.`;

  const result = await callLovableAi({
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Samtale indtil nu:\n${transcriptText}\n\nLav 2 nye kort.` },
    ],
    response_format: { type: "json_object" },
  });
  if ("error" in result) return jsonResponse(cardsFallback, result.status);

  const raw = result.json?.choices?.[0]?.message?.content ?? "{}";
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed?.cards) ? parsed.cards.slice(0, 2) : [];
    const cards = arr.map((card: Record<string, unknown>, index: number) => {
      const icon = safeString(card.icon);
      return {
        id: `dyn-${Date.now()}-${index}`,
        title: safeString(card.title, "Replik").slice(0, 24),
        effect: safeString(card.effect, "Tilpasset replik").slice(0, 40),
        cost: Math.max(0, Math.min(3, safeNumber(card.cost))),
        icon: (allowedIcons as readonly string[]).includes(icon) ? icon : "Sparkles",
        prompt: safeString(card.prompt, "..."),
      };
    });
    return jsonResponse(cards.length === 2 ? { cards } : cardsFallback);
  } catch {
    return jsonResponse(cardsFallback);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const { action, payload } = await req.json();
    const data = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    if (action === "replyAsDebtor") return await replyAsDebtor(data);
    if (action === "coachDebrief") return await coachDebrief(data);
    if (action === "suggestDynamicCards") return await suggestDynamicCards(data);
    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("debtor-ai error", error);
    return jsonResponse({ error: "Backendfejl i AI-kaldet." }, 500);
  }
});
