import { Button } from "@/components/ui/button";
import {
  CREDITOR_CARDS,
  type ActionCard,
  type CollectorAvatar,
  type DebtorProfile,
} from "@/lib/game-data";
import { ArrowLeft, Play, Check } from "lucide-react";
import { CardIcon } from "./CardIcon";

const MAX_DECK = 4;

export function ChooseCards({
  collector,
  debtor,
  deck,
  onChange,
  onBack,
  onStart,
}: {
  collector: CollectorAvatar;
  debtor: DebtorProfile;
  deck: ActionCard[];
  onChange: (d: ActionCard[]) => void;
  onBack: () => void;
  onStart: () => void;
}) {
  const toggle = (card: ActionCard) => {
    const has = deck.find((c) => c.id === card.id);
    if (has) onChange(deck.filter((c) => c.id !== card.id));
    else if (deck.length < MAX_DECK) onChange([...deck, card]);
  };

  return (
    <main className="container mx-auto min-h-screen px-6 py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Trin 2 / 3</p>
          <h2 className="mt-2 font-display text-4xl font-bold md:text-5xl">Vælg dine kort</h2>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Sammensæt dit kortsæt til denne sag. Hvert kort har en pris i pres-point.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Sag</p>
          <p className="font-display text-lg">#{debtor.caseId} · {debtor.amount.toLocaleString("da-DK")} kr</p>
          <p className="text-xs text-muted-foreground">Spiller som {collector.name} — {collector.title}</p>
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between">
        <p className="font-display text-sm uppercase tracking-widest text-[color:var(--creditor)]">
          Action Cards (Creditor)
        </p>
        <p className="text-sm text-muted-foreground">
          Kort i deck: <span className="font-semibold text-foreground">{deck.length}/{MAX_DECK}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {CREDITOR_CARDS.map((card) => {
          const selected = !!deck.find((c) => c.id === card.id);
          const disabled = !selected && deck.length >= MAX_DECK;
          return (
            <button
              key={card.id}
              onClick={() => toggle(card)}
              disabled={disabled}
              className={`relative rounded-xl border p-4 text-left transition-all disabled:opacity-40 ${
                selected
                  ? "border-[color:var(--creditor)] shadow-[var(--shadow-glow-red)]"
                  : "border-border hover:border-muted-foreground/50"
              }`}
              style={{ background: "var(--gradient-card)" }}
            >
              {selected && (
                <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--creditor)] text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--creditor)]/15 text-[color:var(--creditor)]">
                <CardIcon name={card.icon} className="h-5 w-5" />
              </div>
              <p className="font-display text-base font-semibold">{card.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.effect}</p>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold">
                <span className="text-[color:var(--gold)]">●</span> {card.cost} pres
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-12 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Tilbage
        </Button>
        <Button
          size="lg"
          disabled={deck.length === 0}
          onClick={onStart}
          className="h-12 px-8 font-semibold"
        >
          <Play className="mr-2 h-4 w-4" /> Start sag #{debtor.caseId}
        </Button>
      </div>
    </main>
  );
}