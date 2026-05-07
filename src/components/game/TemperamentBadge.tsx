import { AlertTriangle, Flame, Heart, Shield, ShieldAlert } from "lucide-react";
import type { DebtorProfile, HangupRisk } from "@/lib/game-data";

const RISK_META: Record<
  HangupRisk,
  { label: string; color: string; icon: typeof Heart }
> = {
  "lav": { label: "Lægger sjældent på", color: "var(--success)", icon: Heart },
  "middel": { label: "Kan lægge på", color: "var(--gold)", icon: Shield },
  "høj": { label: "Lægger let på", color: "var(--creditor)", icon: ShieldAlert },
  "meget høj": { label: "Lægger på med det samme", color: "var(--destructive)", icon: Flame },
};

export function TemperamentBadge({
  debtor,
  size = "sm",
}: {
  debtor: DebtorProfile;
  size?: "sm" | "md";
}) {
  const t = debtor.temperament;
  const meta = RISK_META[t.hangupRisk];
  const Icon = meta.icon;
  const px = size === "md" ? "px-3 py-1.5 text-xs" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${px}`}
      style={{ borderColor: `color-mix(in oklab, ${meta.color} 50%, transparent)`, color: meta.color, background: `color-mix(in oklab, ${meta.color} 10%, transparent)` }}
      title={`Triggere: ${t.triggers.join(", ")}`}
    >
      <Icon className="h-3 w-3" />
      {t.label} · {meta.label}
    </span>
  );
}

export function TemperamentPanel({ debtor }: { debtor: DebtorProfile }) {
  const t = debtor.temperament;
  const meta = RISK_META[t.hangupRisk];
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        borderColor: `color-mix(in oklab, ${meta.color} 40%, transparent)`,
        background: `color-mix(in oklab, ${meta.color} 8%, transparent)`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" style={{ color: meta.color }} />
          <p className="font-display text-sm uppercase tracking-widest" style={{ color: meta.color }}>
            Temperament: {t.label}
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: meta.color }}>
          {meta.label}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t.mood}</p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Tålmodighed</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="h-2 w-4 rounded-sm"
              style={{
                background: i < t.patience ? meta.color : "color-mix(in oklab, currentColor 15%, transparent)",
              }}
            />
          ))}
        </div>
      </div>
      {t.triggers.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Triggere</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {t.triggers.map((tr) => (
              <span
                key={tr}
                className="rounded-full border px-2 py-0.5 text-[10px]"
                style={{ borderColor: `color-mix(in oklab, ${meta.color} 35%, transparent)` }}
              >
                {tr}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}