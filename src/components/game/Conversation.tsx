import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Flag, Handshake, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CardIcon } from "./CardIcon";
import { TemperamentBadge } from "./TemperamentBadge";
import { replyAsDebtor, suggestDynamicCards } from "@/lib/debtor.functions";
import type { ActionCard, CollectorAvatar, Level } from "@/lib/game-data";
import { evaluateLevel, type PlayContext } from "@/lib/scoring";
import type { ResultData } from "./Game";

export type ChatMsg = { role: "collector" | "debtor"; text: string };

export function Conversation({
  collector,
  level,
  deck,
  onFinish,
  onBack,
}: {
  collector: CollectorAvatar;
  level: Level;
  deck: ActionCard[];
  onFinish: (r: ResultData) => void;
  onBack: () => void;
}) {
  const debtor = level.debtor;
  const replyFn = useServerFn(replyAsDebtor);
  const dynamicFn = useServerFn(suggestDynamicCards);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "debtor", text: debtor.initialLine },
  ]);
  const [round, setRound] = useState(1);
  const [pressure, setPressure] = useState(0);
  const [busy, setBusy] = useState(false);
  const [usedCards, setUsedCards] = useState<string[]>([]);
  const [agreement, setAgreement] = useState({ monthly: 0, lump: 0 });
  const [debtorOffer, setDebtorOffer] = useState<{ monthly: number; lump: number }>({ monthly: 0, lump: 0 });
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerType, setOfferType] = useState<"monthly" | "lump">("monthly");
  const [offerAmount, setOfferAmount] = useState<string>("");
  const [dynamicCards, setDynamicCards] = useState<ActionCard[]>([]);
  const [dynLoading, setDynLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastDebtorLine = [...messages].reverse().find((m) => m.role === "debtor")?.text ?? debtor.initialLine;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Refresh adaptive cards whenever the debtor has spoken
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "debtor") return;
    let cancelled = false;
    setDynLoading(true);
    dynamicFn({
      data: {
        transcript: messages.slice(-8),
        collectorTrait: collector.systemTrait,
        collectorName: collector.name,
        debtorName: debtor.name,
      },
    })
      .then((res) => {
        if (cancelled) return;
        setDynamicCards((res?.cards as ActionCard[]) ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDynLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  function finishWith(verdict: "agreed" | "refused" | "timeout" | "hangup", monthly: number, lump: number, finalUsed: string[], finalPressure: number) {
    const ctx: PlayContext = {
      agreed: verdict === "agreed",
      monthlyAmount: monthly,
      lumpSum: lump,
      rounds: round,
      pressureUsed: finalPressure,
      usedCardIds: finalUsed,
      collectorId: collector.id,
    };
    const evald = evaluateLevel(level, ctx);
    // Forced loss: a hangup always means failure regardless of objectives
    const outcome = verdict === "hangup" ? ("lose" as const) : evald.outcome;
    const stars = verdict === "hangup" ? 0 : evald.stars;
    onFinish({
      outcome,
      stars,
      rounds: round,
      collectorName: collector.name,
      level,
      ctx,
      evaluations: evald.results.map((r) => ({ id: r.objective.id, label: r.objective.label, bonus: !!r.objective.bonus, passed: r.passed })),
      transcript: messages,
      hangup: verdict === "hangup",
    });
  }

  async function playCard(card: ActionCard) {
    if (busy) return;
    setBusy(true);
    const collectorLine = card.prompt;
    // Dynamic cards are one-shot: remove them from the slot when played
    if (card.id.startsWith("dyn-")) {
      setDynamicCards((d) => d.filter((c) => c.id !== card.id));
    }
    await sendCollectorLine(collectorLine, [...usedCards, card.id], pressure + card.cost);
  }

  async function sendCollectorLine(collectorLine: string, newUsed: string[], newPressure: number) {
    const newMessages: ChatMsg[] = [...messages, { role: "collector", text: collectorLine }];
    setMessages(newMessages);
    setUsedCards(newUsed);
    setPressure(newPressure);

    const aiMessages = newMessages.map((m) => ({
      role: m.role === "collector" ? ("user" as const) : ("assistant" as const),
      content: m.text,
    }));
    const systemPrompt = `${debtor.systemPrompt}\n\n${debtor.temperament.cue}\n\nThe collector has this style: ${collector.systemTrait}.`;

    try {
      const { reply, verdict, monthlyAmount, lumpSum, proposedMonthly, proposedLump } = await replyFn({ data: { systemPrompt, messages: aiMessages } });
      setMessages((m) => [...m, { role: "debtor", text: reply || "..." }]);

      const newAgreement = {
        monthly: monthlyAmount || agreement.monthly,
        lump: lumpSum || agreement.lump,
      };
      setAgreement(newAgreement);
      if (proposedMonthly || proposedLump) {
        setDebtorOffer({ monthly: proposedMonthly || 0, lump: proposedLump || 0 });
      }

      if (verdict === "agreed") {
        setBusy(false);
        finishWith("agreed", newAgreement.monthly, newAgreement.lump, newUsed, newPressure);
        return;
      }
      if (verdict === "hangup") {
        setMessages((m) => [
          ...m,
          { role: "debtor", text: "*lægger på*" },
        ]);
        setBusy(false);
        finishWith("hangup", 0, 0, newUsed, newPressure);
        return;
      }
      if (verdict === "refused") {
        setBusy(false);
        finishWith("refused", newAgreement.monthly, newAgreement.lump, newUsed, newPressure);
        return;
      }

      // Hard pressure ceiling — instant hangup if collector goes way over the cap
      if (newPressure > level.pressureCap * 1.5) {
        setMessages((m) => [
          ...m,
          { role: "debtor", text: "Det her er nok! Jeg gider ikke høre mere — farvel! *lægger på*" },
        ]);
        setBusy(false);
        finishWith("hangup", 0, 0, newUsed, newPressure);
        return;
      }

      const nextRound = round + 1;
      if (nextRound > level.maxRounds) {
        setBusy(false);
        finishWith("timeout", newAgreement.monthly, newAgreement.lump, newUsed, newPressure);
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

  async function submitOffer() {
    const amt = Number(offerAmount.replace(/\D/g, ""));
    if (!amt || busy) return;
    const text =
      offerType === "monthly"
        ? `FORSLAG: ${amt.toLocaleString("da-DK")} kr/md i en afdragsordning. Kan du acceptere det?`
        : `FORSLAG: ${amt.toLocaleString("da-DK")} kr som engangsbeløb inden for 14 dage. Kan du acceptere det?`;
    setOfferOpen(false);
    setOfferAmount("");
    setBusy(true);
    await sendCollectorLine(text, usedCards, pressure);
  }

  return (
    <main className="container mx-auto grid min-h-screen grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1fr_360px]">
      <section
        className="flex min-h-[70vh] flex-col rounded-2xl border border-border"
        style={{ background: "var(--gradient-card)" }}
      >
        {/* Debtor stage — large, present portrait */}
        <header className="relative overflow-hidden border-b border-border">
          <div className="grid grid-cols-[110px_1fr] gap-4 p-4 sm:grid-cols-[130px_1fr] sm:p-5">
            <div className="relative">
              <img
                src={debtor.image}
                alt={debtor.name}
                width={130}
                height={130}
                loading="lazy"
                className="aspect-square w-full rounded-2xl object-cover shadow-[var(--shadow-elegant)] ring-2 ring-[color:var(--debtor)]"
              />
              {busy && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-[color:var(--debtor)]/40 bg-background px-2 py-0.5 text-[10px] text-[color:var(--debtor)] shadow">
                  taler…
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Bane {level.number} · Sag #{debtor.caseId}
                  </p>
                  <h2 className="font-display text-xl leading-tight sm:text-2xl">
                    {debtor.name}, {debtor.age}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Skylder{" "}
                    <span className="font-semibold text-[color:var(--gold)]">
                      {debtor.amount.toLocaleString("da-DK")} kr
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Stat label="Runde" value={`${round}/${level.maxRounds}`} />
                  <Stat label="Pres" value={`${pressure}/${level.pressureCap}`} accent={pressure > level.pressureCap} />
                </div>
              </div>
              <div className="mt-2">
                <TemperamentBadge debtor={debtor} />
              </div>
              <blockquote
                className="mt-2 rounded-lg border-l-4 border-[color:var(--debtor)] bg-background/60 px-3 py-2 text-xs italic leading-snug line-clamp-2"
                aria-label="Seneste replik fra debitor"
              >
                “{lastDebtorLine}”
              </blockquote>
            </div>
          </div>
        </header>

        {/* Live objective tracker */}
        <div className="border-b border-border bg-background/40 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-[color:var(--gold)]">
            <Target className="h-3.5 w-3.5" />
            <p className="text-[10px] font-semibold uppercase tracking-widest">Mål</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {level.objectives.map((o) => {
              const ctx: PlayContext = {
                agreed: false,
                monthlyAmount: agreement.monthly,
                lumpSum: agreement.lump,
                rounds: round,
                pressureUsed: pressure,
                usedCardIds: usedCards,
                collectorId: collector.id,
              };
              // Live: ignore "agreed" requirement for status tracking on non-agreement objectives
              const livePassed =
                o.kind === "agreement"
                  ? agreement.monthly > 0 || agreement.lump > 0
                  : (() => {
                      // run eval as if agreed=true to show the metric status
                      return evalLive(o, { ...ctx, agreed: true });
                    })();
              return (
                <span
                  key={o.id}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${
                    livePassed
                      ? "border-[color:var(--success)]/40 bg-[color:var(--success)]/10 text-[color:var(--success)]"
                      : o.bonus
                      ? "border-border text-muted-foreground"
                      : "border-[color:var(--creditor)]/30 text-foreground"
                  }`}
                >
                  {o.bonus ? "★ " : "● "}
                  {o.label}
                </span>
              );
            })}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-6">
          {messages.map((m, i) => (
            <Bubble key={i} msg={m} collector={collector} debtorImage={debtor.image} debtorName={debtor.name} />
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
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--creditor)]/15 text-[color:var(--creditor)]">
                      <CardIcon name={card.icon} className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-semibold text-[color:var(--gold)]">
                      −{card.cost}
                    </span>
                  </div>
                  <p className="text-sm font-semibold leading-tight">{card.title}</p>
                  <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                    {card.effect}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Adaptive AI-generated cards */}
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-[11px] uppercase tracking-widest text-[color:var(--gold)]">
                Tilpassede kort
              </p>
              <span className="text-[10px] text-muted-foreground">
                {dynLoading ? "opdaterer…" : "live"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((slot) => {
                const card = dynamicCards[slot];
                if (!card) {
                  return (
                    <div
                      key={slot}
                      className="flex h-[112px] items-center justify-center rounded-xl border border-dashed border-[color:var(--gold)]/30 p-3 text-[10px] text-muted-foreground"
                    >
                      {dynLoading ? "Genererer…" : "Tomt slot"}
                    </div>
                  );
                }
                const used = usedCards.includes(card.id);
                return (
                  <button
                    key={card.id}
                    onClick={() => playCard(card)}
                    disabled={busy || used}
                    className="group rounded-xl border border-[color:var(--gold)]/40 p-3 text-left transition-all hover:border-[color:var(--gold)] hover:shadow-[0_0_20px_-4px_var(--gold)] disabled:opacity-30"
                    style={{ background: "var(--gradient-card)" }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
                        <CardIcon name={card.icon} className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-semibold text-[color:var(--gold)]">
                        −{card.cost}
                      </span>
                    </div>
                    <p className="text-sm font-semibold leading-tight">{card.title}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
                      {card.effect}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[color:var(--gold)]/40 bg-[color:var(--gold)]/5 p-3">
            {(debtorOffer.monthly > 0 || debtorOffer.lump > 0) && (
              <div className="mb-3 rounded-lg border border-[color:var(--success)]/40 bg-[color:var(--success)]/10 p-2">
                <p className="text-[11px] uppercase tracking-widest text-[color:var(--success)]">
                  {debtor.name} foreslår
                </p>
                <p className="mt-0.5 font-display text-base">
                  {debtorOffer.monthly > 0
                    ? `${debtorOffer.monthly.toLocaleString("da-DK")} kr/md`
                    : `${debtorOffer.lump.toLocaleString("da-DK")} kr engangs`}
                </p>
                <Button
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    finishWith("agreed", debtorOffer.monthly, debtorOffer.lump, usedCards, pressure)
                  }
                  className="mt-2 w-full"
                >
                  <Check className="mr-2 h-4 w-4" /> Godkend forslag
                </Button>
              </div>
            )}
            <p className="font-display text-xs uppercase tracking-widest text-[color:var(--gold)]">
              Foreslå konkret aftale
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Læg et tal på bordet. Debitor kan acceptere, modforhandle eller afvise.
            </p>
            {!offerOpen ? (
              <Button size="sm" onClick={() => setOfferOpen(true)} disabled={busy} className="mt-2 w-full">
                <Handshake className="mr-2 h-4 w-4" /> Lav et tilbud
              </Button>
            ) : (
              <div className="mt-2 space-y-2">
                <div className="flex gap-1">
                  <button
                    onClick={() => setOfferType("monthly")}
                    className={`flex-1 rounded-md border px-2 py-1 text-[11px] ${offerType === "monthly" ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10" : "border-border"}`}
                  >
                    kr/md
                  </button>
                  <button
                    onClick={() => setOfferType("lump")}
                    className={`flex-1 rounded-md border px-2 py-1 text-[11px] ${offerType === "lump" ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10" : "border-border"}`}
                  >
                    Engangsbeløb
                  </button>
                </div>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="Beløb i DKK"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  className="h-9"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitOffer} disabled={busy || !offerAmount} className="flex-1">
                    Send forslag
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setOfferOpen(false)}>
                    Annullér
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => {
              const hasDeal = agreement.monthly > 0 || agreement.lump > 0;
              finishWith(hasDeal ? "agreed" : "timeout", agreement.monthly, agreement.lump, usedCards, pressure);
            }}
            disabled={busy}
            className="mt-3 w-full"
          >
            <Flag className="mr-2 h-4 w-4" />
            {agreement.monthly > 0 || agreement.lump > 0 ? "Afslut & bekræft aftale" : "Afslut sagen"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onBack} className="mt-2 w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Forlad samtalen
          </Button>
        </div>
      </aside>
    </main>
  );
}

function evalLive(o: import("@/lib/game-data").LevelObjective, ctx: PlayContext): boolean {
  switch (o.kind) {
    case "agreement":
      return ctx.agreed;
    case "min_monthly":
      return ctx.monthlyAmount >= (o.target ?? 0) || ctx.lumpSum >= (o.target ?? 0);
    case "max_rounds":
      return ctx.rounds <= (o.target ?? 999);
    case "max_pressure":
      return ctx.pressureUsed <= (o.target ?? 999);
    case "no_escalation":
      return !ctx.usedCardIds.some((id) => ["inkasso", "foged"].includes(id));
    case "tone":
      return ctx.collectorId === o.toneRequired;
  }
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-display text-base ${accent ? "text-[color:var(--destructive)]" : "text-[color:var(--gold)]"}`}>{value}</p>
    </div>
  );
}

function Bubble({
  msg,
  collector,
  debtorImage,
  debtorName,
}: {
  msg: ChatMsg;
  collector: CollectorAvatar;
  debtorImage: string;
  debtorName: string;
}) {
  const isCollector = msg.role === "collector";
  return (
    <div className={`flex items-end gap-3 ${isCollector ? "justify-end" : "justify-start"}`}>
      {!isCollector && (
        <img
          src={debtorImage}
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[color:var(--debtor)] shadow-md"
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
          {isCollector ? collector.name : debtorName}
        </p>
        {msg.text}
      </div>
      {isCollector && (
        <img
          src={collector.image}
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[color:var(--creditor)] shadow-md"
        />
      )}
    </div>
  );
}
