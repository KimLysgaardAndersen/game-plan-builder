import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CardIcon } from "./CardIcon";
import { replyAsDebtor } from "@/lib/debtor.functions";
import type { ActionCard, CollectorAvatar, DebtorProfile } from "@/lib/game-data";
import type { ResultData } from "./Game";

type ChatMsg = { role: "collector" | "debtor"; text: string };

const MAX_ROUNDS = 6;

export function Conversation({
  collector,
  debtor,
  deck,
  onFinish,
  onBack,
}: {
  collector: CollectorAvatar;
  debtor: DebtorProfile;
  deck: ActionCard[];
  onFinish: (r: ResultData) => void;
  onBack: () => void;
}) {
  const replyFn = useServerFn(replyAsDebtor);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "debtor", text: debtor.initialLine },
  ]);
  const [round, setRound] = useState(1);
  const [pressure, setPressure] = useState(0);
  const [busy, setBusy] = useState(false);
  const [usedCards, setUsedCards] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function playCard(card: ActionCard) {
    if (busy) return;
    setBusy(true);
    const collectorLine = card.prompt;
    const newMessages: ChatMsg[] = [...messages, { role: "collector", text: collectorLine }];
    setMessages(newMessages);
    setUsedCards((u) => [...u, card.id]);
    const newPressure = pressure + card.cost;
    setPressure(newPressure);

    const aiMessages = newMessages.map((m) => ({
      role: m.role === "collector" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));
    const systemPrompt = `${debtor.systemPrompt} The collector you are speaking with has this style: ${collector.systemTrait}.`;

    try {
      const { reply, verdict } = await replyFn({ data: { systemPrompt, messages: aiMessages } });
      setMessages((m) => [...m, { role: "debtor", text: reply || "..." }]);

      if (verdict === "agreed") {
        setBusy(false);
        onFinish({ outcome: "win", rounds: round, collectorName: collector.name });
        return;
      }
      if (verdict === "refused") {
        setBusy(false);
        onFinish({ outcome: "lose", rounds: round, collectorName: collector.name });
        return;
      }

      const nextRound = round + 1;
      if (nextRound > MAX_ROUNDS) {
        setBusy(false);
        onFinish({
          outcome: newPressure >= 6 ? "partial" : "lose",
          rounds: round,
          collectorName: collector.name,
        });
        return;
      }
      setRound(nextRound);
    } catch (e) {
      console.error(e);
      setMessages((m) => [...m, { role: "debtor", text: "(forbindelsen blev afbrudt)" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container mx-auto grid min-h-screen grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
      <section
        className="flex min-h-[70vh] flex-col rounded-2xl border border-border"
        style={{ background: "var(--gradient-card)" }}
      >
        <header className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <img
              src={debtor.image}
              alt={debtor.name}
              width={48}
              height={48}
              loading="lazy"
              className="h-12 w-12 rounded-full object-cover ring-2 ring-[color:var(--debtor)]"
            />
            <div>
              <p className="font-display text-lg leading-tight">
                {debtor.name}, {debtor.age}
              </p>
              <p className="text-xs text-muted-foreground">
                Sag #{debtor.caseId} · {debtor.amount.toLocaleString("da-DK")} kr
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Stat label="Runde" value={`${round}/${MAX_ROUNDS}`} />
            <Stat label="Pres" value={String(pressure)} accent />
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((m, i) => (
            <Bubble key={i} msg={m} collector={collector} debtor={debtor} />
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--debtor)]" />
              {debtor.name} skriver...
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <div
          className="rounded-2xl border border-border p-4"
          style={{ background: "var(--gradient-card)" }}
        >
          <p className="font-display text-sm uppercase tracking-widest text-[color:var(--creditor)]">
            Dine kort
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Spiller som {collector.name}</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {deck.map((card) => {
              const used = usedCards.includes(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => playCard(card)}
                  disabled={busy || used}
                  className={`group rounded-xl border p-3 text-left transition-all disabled:opacity-30 ${
                    used
                      ? "border-border"
                      : "border-border hover:border-[color:var(--creditor)] hover:shadow-[var(--shadow-glow-red)]"
                  }`}
                  style={{ background: "var(--gradient-card)" }}
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--creditor)]/15 text-[color:var(--creditor)]">
                    <CardIcon name={card.icon} className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold leading-tight">{card.title}</p>
                  <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                    {card.effect}
                  </p>
                </button>
              );
            })}
          </div>

          <Button variant="ghost" size="sm" onClick={onBack} className="mt-6 w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Forlad samtalen
          </Button>
        </div>
      </aside>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-display text-base ${accent ? "text-[color:var(--gold)]" : ""}`}>{value}</p>
    </div>
  );
}

function Bubble({
  msg,
  collector,
  debtor,
}: {
  msg: ChatMsg;
  collector: CollectorAvatar;
  debtor: DebtorProfile;
}) {
  const isCollector = msg.role === "collector";
  return (
    <div className={`flex items-end gap-3 ${isCollector ? "justify-end" : "justify-start"}`}>
      {!isCollector && (
        <img
          src={debtor.image}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover"
        />
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isCollector
            ? "rounded-br-sm bg-[color:var(--creditor)] text-primary-foreground"
            : "rounded-bl-sm bg-muted text-foreground"
        }`}
      >
        <p className="mb-1 text-[10px] uppercase tracking-widest opacity-70">
          {isCollector ? collector.name : debtor.name}
        </p>
        {msg.text}
      </div>
      {isCollector && (
        <img
          src={collector.image}
          alt=""
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover"
        />
      )}
    </div>
  );
}