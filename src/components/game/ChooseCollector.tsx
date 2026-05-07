import { Button } from "@/components/ui/button";
import { COLLECTORS, type CollectorAvatar } from "@/lib/game-data";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

export function ChooseCollector({
  selected,
  onSelect,
  onBack,
  onNext,
}: {
  selected: CollectorAvatar;
  onSelect: (c: CollectorAvatar) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <main className="container mx-auto min-h-screen px-6 py-12">
      <header className="mb-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--gold)]">Trin 1 / 3</p>
        <h2 className="mt-3 font-display text-4xl font-bold md:text-5xl">Vælg din avatar</h2>
        <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
          Hver collector har en distinkt psykologisk profil. Den påvirker tonen i samtalen — og
          hvordan debitor reagerer på dine kort.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {COLLECTORS.map((c) => {
          const active = c.id === selected.id;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className={`group relative overflow-hidden rounded-2xl border text-left transition-all ${
                active
                  ? "border-[color:var(--creditor)] shadow-[var(--shadow-glow-red)]"
                  : "border-border hover:border-muted-foreground/50"
              }`}
              style={{ background: "var(--gradient-card)" }}
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={c.image}
                  alt={`${c.name} – ${c.title}`}
                  width={768}
                  height={1024}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                {active && (
                  <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--creditor)] text-primary-foreground">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-display text-2xl font-semibold">{c.name}</p>
                <p className="text-sm text-[color:var(--gold)]">{c.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">{c.tagline}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-12 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Tilbage
        </Button>
        <Button size="lg" onClick={onNext} className="h-12 px-8 font-semibold">
          Vælg kort <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}