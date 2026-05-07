import type { Level, LevelObjective, CollectorId } from "./game-data";

export interface PlayContext {
  agreed: boolean;
  monthlyAmount: number; // 0 if none
  lumpSum: number;
  rounds: number;
  pressureUsed: number;
  usedCardIds: string[]; // ids actually played
  collectorId: CollectorId;
}

export interface ObjectiveResult {
  objective: LevelObjective;
  passed: boolean;
}

const ESCALATION_CARDS = ["inkasso", "foged"];

export function evaluateObjective(o: LevelObjective, ctx: PlayContext): boolean {
  switch (o.kind) {
    case "agreement":
      return ctx.agreed;
    case "min_monthly":
      // Pass if monthly meets target OR lumpSum covers target (full payment)
      return (ctx.monthlyAmount >= (o.target ?? 0)) || (ctx.lumpSum >= (o.target ?? 0));
    case "max_rounds":
      return ctx.agreed && ctx.rounds <= (o.target ?? 999);
    case "max_pressure":
      return ctx.pressureUsed <= (o.target ?? 999);
    case "no_escalation":
      return !ctx.usedCardIds.some((id) => ESCALATION_CARDS.includes(id));
    case "tone":
      return ctx.collectorId === o.toneRequired;
  }
}

export function evaluateLevel(level: Level, ctx: PlayContext) {
  const results: ObjectiveResult[] = level.objectives.map((o) => ({
    objective: o,
    passed: evaluateObjective(o, ctx),
  }));
  const primary = results.filter((r) => !r.objective.bonus);
  const bonus = results.filter((r) => r.objective.bonus);
  const primaryPassed = primary.every((r) => r.passed);
  const bonusPassed = bonus.filter((r) => r.passed).length;
  // 1 star = primary cleared, +1 per bonus, capped at 3
  const stars = primaryPassed ? Math.min(3, 1 + bonusPassed) : 0;
  const outcome: "win" | "partial" | "lose" = primaryPassed
    ? stars >= 2
      ? "win"
      : "partial"
    : "lose";
  return { results, primary, bonus, stars, outcome };
}
