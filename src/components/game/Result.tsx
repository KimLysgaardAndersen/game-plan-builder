import { Button } from "@/components/ui/button";
import type { ResultData } from "./Game";
import { Trophy, Frown, Handshake, RotateCw, Home } from "lucide-react";

const COPY: Record<ResultData["outcome"], { title: string; sub: string; xp: number; tone: string }> = {
  win: { title: "Aftale i hus!", sub: "Debitor accepterede en realistisk afdragsordning.", xp: 250, tone: "var(--success)" },
  partial: { title: "Delvis succes", sub: "Du holdt tonen, men en aftale blev ikke lukket.", xp: 100, tone: "var(--gold)" },
  lose: { title: "Samtalen brød sammen", sub: "Debitor afsluttede uden aftale. Prøv en blødere tilgang.", xp: 25, tone: "var(--destructive)" },
};

const ICONS: Record<ResultData["outcome"], React.ReactNode> = {
  win: <Trophy className="h-10 w-10" />,
  partial: <Handshake className="h-10 w-10" />,
  lose: <Frown className="h-10 w-10" />,
};

export function Result({ result, onReplay, onMenu }: { result: ResultData; onReplay: () => void; onMenu: () => void }) {
  const c = COPY[result.outcome];
  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-border p-10 text-center" style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-elegant)" }}>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: `color-mix(in oklab, ${c.tone} 18%, transparent)`, color: c.tone }}>
          {ICONS[result.outcome]}
        </div>
        <h2 className="mt-6 font-display text-4xl font-bold">{c.title}</h2>
        <p className="mt-2 text-muted-foreground">{c.sub}</p>
        <div className="mt-8 grid grid-cols-3 gap-3 text-left">
          <Stat label="Runder" value={String(result.rounds)} />
          <Stat label="XP" value={`+${c.xp}`} accent />
          <Stat label="Avatar" value={result.collectorName} />
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button size="lg" onClick={onReplay} className="font-semibold"><RotateCw className="mr-2 h-4 w-4" /> Næste sag</Button>
          <Button size="lg" variant="outline" onClick={onMenu}><Home className="mr-2 h-4 w-4" /> Hovedmenu</Button>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`font-display text-lg ${accent ? "text-[color:var(--gold)]" : ""}`}>{value}</p>
    </div>
  );
}