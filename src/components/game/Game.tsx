import { useState } from "react";
import { Welcome } from "./Welcome";
import { ChooseCollector } from "./ChooseCollector";
import { ChooseCards } from "./ChooseCards";
import { Conversation } from "./Conversation";
import { Result } from "./Result";
import { COLLECTORS, CREDITOR_CARDS, TUTORIAL_DEBTOR, type CollectorAvatar, type ActionCard } from "@/lib/game-data";

type Step = "welcome" | "collector" | "cards" | "conversation" | "result";

export interface ResultData {
  outcome: "win" | "partial" | "lose";
  rounds: number;
  collectorName: string;
}

export function Game() {
  const [step, setStep] = useState<Step>("welcome");
  const [collector, setCollector] = useState<CollectorAvatar>(COLLECTORS[0]);
  const [deck, setDeck] = useState<ActionCard[]>(CREDITOR_CARDS.slice(0, 4));
  const [result, setResult] = useState<ResultData | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {step === "welcome" && <Welcome onStart={() => setStep("collector")} />}
      {step === "collector" && (
        <ChooseCollector
          selected={collector}
          onSelect={setCollector}
          onBack={() => setStep("welcome")}
          onNext={() => setStep("cards")}
        />
      )}
      {step === "cards" && (
        <ChooseCards
          collector={collector}
          debtor={TUTORIAL_DEBTOR}
          deck={deck}
          onChange={setDeck}
          onBack={() => setStep("collector")}
          onStart={() => setStep("conversation")}
        />
      )}
      {step === "conversation" && (
        <Conversation
          collector={collector}
          debtor={TUTORIAL_DEBTOR}
          deck={deck}
          onFinish={(r: ResultData) => {
            setResult(r);
            setStep("result");
          }}
          onBack={() => setStep("cards")}
        />
      )}
      {step === "result" && result && (
        <Result
          result={result}
          onReplay={() => setStep("cards")}
          onMenu={() => setStep("welcome")}
        />
      )}
    </div>
  );
}