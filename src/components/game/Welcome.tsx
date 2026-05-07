import { Button } from "@/components/ui/button";
import heroImg from "@/assets/debtor-vs-creditor.jpg";
import { ArrowRight, Sparkles, Users, Shield } from "lucide-react";

export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero)", opacity: 0.6 }}
      />
      <div className="absolute inset-0 -z-10 bg-background/70" />

      <section className="container mx-auto grid min-h-screen grid-cols-1 items-center gap-10 px-6 py-16 lg:grid-cols-2">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--gold)]" />
            Collectia · Communication Hub
          </div>

          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
            <span className="text-[color:var(--debtor)]">Debtor</span>
            <span className="text-muted-foreground"> &amp; </span>
            <span className="text-[color:var(--creditor)]">Collector</span>
          </h1>

          <p className="max-w-xl text-lg text-muted-foreground">
            Et tur-baseret træningsspil hvor du forhandler dig gennem realistiske
            inddrivelses­samtaler. Vælg din avatar, sammensæt dit kortdeck og test din empati,
            compliance og tone over for en AI-drevet debitor.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <Feature icon={<Users className="h-4 w-4" />} title="4 collector-profiler" desc="Pragmatisk, empatisk, hård, kammeratlig" />
            <Feature icon={<Shield className="h-4 w-4" />} title="Compliance-træning" desc="Lær lovlige og etiske valg" />
            <Feature icon={<Sparkles className="h-4 w-4" />} title="AI-debitor" desc="Reagerer på din tone" />
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button size="lg" onClick={onStart} className="h-12 px-8 text-base font-semibold">
              Start træning <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">Demo · spil som Collector</span>
          </div>
        </div>

        <div className="relative">
          <div
            className="absolute -inset-6 rounded-3xl opacity-60 blur-2xl"
            style={{ background: "var(--gradient-hero)" }}
          />
          <img
            src={heroImg}
            alt="Debtor vs Creditor — duell mellem skyldner og inddriver"
            width={1024}
            height={1024}
            className="relative w-full rounded-3xl border border-border object-cover shadow-2xl"
          />
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--gold)]/15 text-[color:var(--gold)]">
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}