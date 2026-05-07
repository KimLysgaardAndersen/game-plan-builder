import { useState } from "react";
import { Welcome } from "./Welcome";
import { LevelSelect } from "./LevelSelect";
import { Briefing } from "./Briefing";
import { ChooseCollector } from "./ChooseCollector";
import { ChooseCards } from "./ChooseCards";
import { Conversation, type ChatMsg } from "./Conversation";
import { Result } from "./Result";
import {
  COLLECTORS,
  CREDITOR_CARDS,
  LEVELS,
  type CollectorAvatar,
  type ActionCard,
  type Level,
} from "@/lib/game-data";
import type { PlayContext } from "@/lib/scoring";

type Step = "welcome" | "levels" | "briefing" | "collector" | "cards" | "conversation" | "result";

export interface ResultData {
  outcome: "win" | "partial" | "lose";
  stars: number;
  rounds: number;
  collectorName: string;
  level: Level;
  ctx: PlayContext;
  evaluations: { id: string; label: string; bonus: boolean; passed: boolean }[];
  transcript: ChatMsg[];
  hangup?: boolean;
}

export function Game() {
  const [step, setStep] = useState<Step>("welcome");
  const [level, setLevel] = useState<Level>(LEVELS[0]);
  const [collector, setCollector] = useState<CollectorAvatar>(COLLECTORS[0]);
  const [deck, setDeck] = useState<ActionCard[]>(CREDITOR_CARDS.slice(0, 6));
  const [result, setResult] = useState<ResultData | null>(null);
  const [highestUnlocked, setHighestUnlocked] = useState(1);
  const [starsByLevel, setStarsByLevel] = useState<Record<string, number>>({});
  const [attempt, setAttempt] = useState(0);

  const currentIdx = LEVELS.findIndex((l) => l.id === level.id);
  const nextLevel = LEVELS[currentIdx + 1];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {step === "welcome" && <Welcome onStart={() => setStep("levels")} />}
      {step === "levels" && (
        <LevelSelect
          highestUnlocked={highestUnlocked}
          starsByLevel={starsByLevel}
          onPick={(l) => {
            setLevel(l);
            setStep("briefing");
          }}
          onBack={() => setStep("welcome")}
        />
      )}
      {step === "briefing" && (
        <Briefing
          level={level}
          onBack={() => setStep("levels")}
          onNext={() => setStep("collector")}
        />
      )}
      {step === "collector" && (
        <ChooseCollector
          selected={collector}
          onSelect={setCollector}
          onBack={() => setStep("briefing")}
          onNext={() => setStep("cards")}
        />
      )}
      {step === "cards" && (
        <ChooseCards
          collector={collector}
          debtor={level.debtor}
          deck={deck}
          onChange={setDeck}
          onBack={() => setStep("collector")}
          onStart={() => setStep("conversation")}
        />
      )}
      {step === "conversation" && (
        <Conversation
          key={`${level.id}-${attempt}`}
          collector={collector}
          level={level}
          deck={deck}
          onFinish={(r) => {
            setResult(r);
            setStarsByLevel((s) => ({ ...s, [level.id]: Math.max(s[level.id] ?? 0, r.stars) }));
            if (r.outcome !== "lose") {
              setHighestUnlocked((h) => Math.max(h, level.number + 1));
            }
            setStep("result");
          }}
          onBack={() => setStep("cards")}
        />
      )}
      {step === "result" && result && (
        <Result
          result={result}
          hasNext={!!nextLevel}
          onReplay={() => {
            setAttempt((a) => a + 1);
            setStep("conversation");
          }}
          onNextLevel={() => {
            if (nextLevel) {
              setLevel(nextLevel);
              setAttempt((a) => a + 1);
              setStep("briefing");
            }
          }}
          onMenu={() => setStep("levels")}
        />
      )}
    </div>
  );
}
