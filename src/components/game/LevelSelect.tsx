import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Star, Sparkles } from "lucide-react";
import { LEVELS, type Level } from "@/lib/game-data";
import { TemperamentBadge } from "./TemperamentBadge";

export function LevelSelect({
  highestUnlocked,
  starsByLevel,
  onPick,
  onBack,
}: {
  highestUnlocked: number;
  starsByLevel: Record<string, number>;
  onPick: (level: Level) => void;
  onBack: () => void;
}) {
  const SECRET_ID = "lvl-6-secret-rasmus";
  const regularLevels = LEVELS.filter((l) => l.id !== SECRET_ID);
  const secretLevel = LEVELS.find((l) => l.id === SECRET_ID);
  const allRegularCleared = regularLevels.every((l) => (starsByLevel[l.id] ?? 0) > 0);
  const secretRevealed = allRegularCleared;
  return (
    <main className="container mx-auto px-6 py-12">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Tilbage
      </Button>
      <h1 className="font-display text-4xl font-bold">Kampagne</h1>
      <p className="mt-2 text-muted-foreground">
        Fem sager — fra den medgørlige til den vrede. Hver bane har et klart mål.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {regularLevels.map((lvl) => {
          const locked = lvl.number > highestUnlocked;
          const stars = starsByLevel[lvl.id] ?? 0;
          return (
            <button
              key={lvl.id}
              disabled={locked}
              onClick={() => onPick(lvl)}
              className={`group relative overflow-hidden rounded-2xl border border-border p-5 text-left transition-all disabled:opacity-50 ${
                !locked && "hover:border-[color:var(--gold)] hover:shadow-[var(--shadow-elegant)]"
              }`}
              style={{ background: "var(--gradient-card)" }}
            >
              <div className="flex items-start gap-4">
                <img
                  src={lvl.debtor.image}
                  alt=""
                  width={72}
                  height={72}
                  loading="lazy"
                  className="h-18 w-18 h-[72px] w-[72px] rounded-xl object-cover ring-2 ring-border"
                />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Bane {lvl.number} · {lvl.difficulty}
                  </p>
                  <p className="font-display text-xl leading-tight">{lvl.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {lvl.debtor.name}, {lvl.debtor.age} · {lvl.debtor.amount.toLocaleString("da-DK")} kr
                  </p>
                  <div className="mt-2">
                    <TemperamentBadge debtor={lvl.debtor} />
                  </div>
                </div>
                {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="mt-4 flex items-center gap-1">
                {[1, 2, 3].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${n <= stars ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
            </button>
          );
        })}
        {secretLevel && secretRevealed && (() => {
          const stars = starsByLevel[secretLevel.id] ?? 0;
          return (
            <button
              key={secretLevel.id}
              onClick={() => onPick(secretLevel)}
              className="group relative overflow-hidden rounded-2xl border-2 border-[color:var(--gold)] p-5 text-left transition-all hover:shadow-[var(--shadow-elegant)] animate-in fade-in zoom-in"
              style={{ background: "var(--gradient-card)" }}
            >
              <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[color:var(--gold)]/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--gold)]">
                <Sparkles className="h-3 w-3" /> Hemmelig
              </div>
              <div className="flex items-start gap-4">
                <img
                  src={secretLevel.debtor.image}
                  alt=""
                  width={72}
                  height={72}
                  loading="lazy"
                  className="h-[72px] w-[72px] rounded-xl object-cover ring-2 ring-[color:var(--gold)]"
                />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-[color:var(--gold)]">
                    Bonus-bane · {secretLevel.difficulty}
                  </p>
                  <p className="font-display text-xl leading-tight">{secretLevel.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {secretLevel.debtor.name}, {secretLevel.debtor.age} · {secretLevel.debtor.amount.toLocaleString("da-DK")} kr
                  </p>
                  <div className="mt-2">
                    <TemperamentBadge debtor={secretLevel.debtor} />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1">
                {[1, 2, 3].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${n <= stars ? "fill-[color:var(--gold)] text-[color:var(--gold)]" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
            </button>
          );
        })()}
        {secretLevel && !secretRevealed && (
          <div
            className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-dashed border-border p-5 opacity-60"
            style={{ background: "var(--gradient-card)" }}
          >
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-xl bg-muted">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                ??? · Hemmelig bane
              </p>
              <p className="font-display text-xl leading-tight">Klar alle fem sager for at låse op</p>
              <p className="mt-1 text-xs text-muted-foreground">
                En sidste, anderledes debitor venter…
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
