import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Target, Star, FileText } from "lucide-react";
import type { Level } from "@/lib/game-data";
import { TemperamentPanel } from "./TemperamentBadge";

export function Briefing({
  level,
  onBack,
  onNext,
}: {
  level: Level;
  onBack: () => void;
  onNext: () => void;
}) {
  const primary = level.objectives.filter((o) => !o.bonus);
  const bonus = level.objectives.filter((o) => o.bonus);

  return (
    <main className="container mx-auto max-w-4xl px-6 py-12">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Vælg anden bane
      </Button>

      <div
        className="overflow-hidden rounded-3xl border border-border"
        style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-elegant)" }}
      >
        <div className="grid gap-6 p-8 md:grid-cols-[200px_1fr]">
          <img
            src={level.debtor.image}
            alt={level.debtor.name}
            width={200}
            height={200}
            className="h-[200px] w-[200px] rounded-2xl object-cover ring-2 ring-[color:var(--debtor)]"
          />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Bane {level.number} · {level.difficulty} · Sag #{level.debtor.caseId}
            </p>
            <h1 className="mt-1 font-display text-4xl font-bold">{level.title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {level.debtor.name}, {level.debtor.age} —{" "}
              <span className="font-semibold text-[color:var(--gold)]">
                {level.debtor.amount.toLocaleString("da-DK")} kr
              </span>
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-background/40 p-4">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm leading-relaxed">{level.brief}</p>
            </div>

            <div className="mt-4">
              <TemperamentPanel debtor={level.debtor} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-t border-border p-8 md:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[color:var(--creditor)]">
              <Target className="h-4 w-4" />
              <p className="font-display text-sm uppercase tracking-widest">Hovedmål</p>
            </div>
            <ul className="space-y-2">
              {primary.map((o) => (
                <li
                  key={o.id}
                  className="rounded-lg border border-[color:var(--creditor)]/30 bg-[color:var(--creditor)]/5 p-3 text-sm font-medium"
                >
                  {o.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2 text-[color:var(--gold)]">
              <Star className="h-4 w-4" />
              <p className="font-display text-sm uppercase tracking-widest">Bonusmål (stjerner)</p>
            </div>
            <ul className="space-y-2">
              {bonus.map((o) => (
                <li
                  key={o.id}
                  className="rounded-lg border border-border bg-background/40 p-3 text-sm"
                >
                  {o.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border p-6">
          <div className="flex gap-6 text-xs text-muted-foreground">
            <span>
              <span className="font-display text-base text-foreground">{level.maxRounds}</span> runder
            </span>
            <span>
              Pres-loft <span className="font-display text-base text-foreground">{level.pressureCap}</span>
            </span>
          </div>
          <Button size="lg" onClick={onNext} className="font-semibold">
            Vælg avatar & deck <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
