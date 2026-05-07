import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import type { ResultData } from "./Game";
import { Star, RotateCw, Home, Check, X, Sparkles, ArrowRight } from "lucide-react";
import { coachDebrief } from "@/lib/debtor.functions";

const TITLES: Record<ResultData["outcome"], { title: string; sub: string; tone: string }> = {
  win: { title: "Bane gennemført!", sub: "Stærkt arbejde — målet er i hus.", tone: "var(--success)" },
  partial: { title: "Delvis succes", sub: "Hovedmålet er klaret, men der er stjerner at hente.", tone: "var(--gold)" },
  lose: { title: "Bane ikke bestået", sub: "Hovedmålet blev ikke opfyldt. Tag den igen.", tone: "var(--destructive)" },
};

export function Result({
  result,
  onReplay,
  onNextLevel,
  onMenu,
  hasNext,
}: {
  result: ResultData;
  onReplay: () => void;
  onNextLevel: () => void;
  onMenu: () => void;
  hasNext: boolean;
}) {
  const c = TITLES[result.outcome];
  const debriefFn = useServerFn(coachDebrief);
  const [feedback, setFeedback] = useState<string>("");
  const [loadingFb, setLoadingFb] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingFb(true);
    const failed = result.evaluations.filter((e) => !e.passed).map((e) => e.label);
    debriefFn({
      data: {
        transcript: result.transcript,
        outcome: result.outcome,
        failedObjectives: failed,
        levelTitle: result.level.title,
      },
    })
      .then((r) => {
        if (active) setFeedback(r.feedback || "");
      })
      .catch(() => active && setFeedback(""))
      .finally(() => active && setLoadingFb(false));
    return () => {
      active = false;
    };
  }, [debriefFn, result]);

  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-6 py-12">
      <div
        className="w-full max-w-2xl rounded-3xl border border-border p-10"
        style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-elegant)" }}
      >
        <div className="text-center">
          <div className="mx-auto inline-flex items-center gap-2">
            {[1, 2, 3].map((n) => (
              <Star
                key={n}
                className={`h-10 w-10 transition-all ${
                  n <= result.stars
                    ? "fill-[color:var(--gold)] text-[color:var(--gold)]"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <h2 className="mt-6 font-display text-4xl font-bold" style={{ color: c.tone }}>
            {c.title}
          </h2>
          <p className="mt-2 text-muted-foreground">{c.sub}</p>
        </div>

        <div className="mt-8 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Mål
          </p>
          {result.evaluations.map((e) => (
            <div
              key={e.id}
              className={`flex items-start gap-3 rounded-xl border p-3 ${
                e.passed
                  ? "border-[color:var(--success)]/30 bg-[color:var(--success)]/5"
                  : "border-border bg-background/30"
              }`}
            >
              {e.passed ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--success)]" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <p className="flex-1 text-sm">
                {e.bonus && <span className="text-[color:var(--gold)]">★ </span>}
                {e.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-[color:var(--gold)]">
            <Sparkles className="h-4 w-4" />
            <p className="font-display text-xs uppercase tracking-widest">Coach-feedback</p>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">
            {loadingFb ? "Coach analyserer samtalen..." : feedback || "Ingen feedback tilgængelig."}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" variant="outline" onClick={onReplay}>
            <RotateCw className="mr-2 h-4 w-4" /> Spil igen
          </Button>
          {hasNext && result.outcome !== "lose" && (
            <Button size="lg" onClick={onNextLevel} className="font-semibold">
              Næste bane <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          <Button size="lg" variant="ghost" onClick={onMenu}>
            <Home className="mr-2 h-4 w-4" /> Kampagne
          </Button>
        </div>
      </div>
    </main>
  );
}
