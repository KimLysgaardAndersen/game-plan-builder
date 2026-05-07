import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Star } from "lucide-react";
import { LEVELS, type Level } from "@/lib/game-data";

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
        {LEVELS.map((lvl) => {
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
      </div>
    </main>
  );
}
