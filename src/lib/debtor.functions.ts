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

const DebriefSchema = z.object({
  transcript: z.array(z.object({ role: z.enum(["collector", "debtor"]), text: z.string() })).max(40),
  outcome: z.enum(["win", "partial", "lose"]),
  failedObjectives: z.array(z.string()).max(10),
  levelTitle: z.string(),
});

const DynamicCardsSchema = z.object({
  transcript: z
    .array(z.object({ role: z.enum(["collector", "debtor"]), text: z.string() }))
    .max(40),
  collectorTrait: z.string(),
  collectorName: z.string(),
  debtorName: z.string(),
});

type DebtorReply = {
  reply: string;
  verdict: "continue" | "agreed" | "refused" | "hangup";
  monthlyAmount: number;
  lumpSum: number;
  proposedMonthly: number;
  proposedLump: number;
};

type DynamicCardsResponse = {
  cards: Array<{
    id: string;
    title: string;
    effect: string;
    cost: number;
    icon: string;
    prompt: string;
  }>;
};

const debtorFallback: DebtorReply = {
  reply: "(Forbindelsesfejl til AI)",
  verdict: "continue",
  monthlyAmount: 0,
  lumpSum: 0,
  proposedMonthly: 0,
  proposedLump: 0,
};

const cardsFallback: DynamicCardsResponse = {
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

function getCloudFunctionUrl() {
  const baseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  if (!baseUrl) throw new Error("Backend URL mangler.");
  return `${baseUrl}/functions/v1/debtor-ai`;
}

async function callDebtorAi<T>(action: string, payload: unknown): Promise<T> {
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const res = await fetch(getCloudFunctionUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(anonKey ? { Authorization: `Bearer ${anonKey}` } : {}),
    },
    body: JSON.stringify({ action, payload }),
  });

  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data?.error ?? "AI-kaldet fejlede.");
  return data;
}

export const replyAsDebtor = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      return await callDebtorAi<DebtorReply>("replyAsDebtor", data);
    } catch (error) {
      console.error(error);
      return debtorFallback;
    }
  });

export const coachDebrief = createServerFn({ method: "POST" })
  .inputValidator((data) => DebriefSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      return await callDebtorAi<{ feedback: string }>("coachDebrief", data);
    } catch (error) {
      console.error(error);
      return { feedback: "Coach utilgængelig lige nu." };
    }
  });

export const suggestDynamicCards = createServerFn({ method: "POST" })
  .inputValidator((data) => DynamicCardsSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      return await callDebtorAi<DynamicCardsResponse>("suggestDynamicCards", data);
    } catch (error) {
      console.error(error);
      return cardsFallback;
    }
  });
