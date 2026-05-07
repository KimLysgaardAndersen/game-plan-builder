import collectorPragmatic from "@/assets/collector-pragmatic.jpg";
import collectorEmpathic from "@/assets/collector-empathic.jpg";
import collectorTough from "@/assets/collector-tough.jpg";
import collectorFriendly from "@/assets/collector-friendly.jpg";
import debtorYoung from "@/assets/debtor-young.jpg";

export type CollectorId = "pragmatic" | "empathic" | "tough" | "friendly";

export interface CollectorAvatar {
  id: CollectorId;
  name: string;
  title: string;
  tagline: string;
  image: string;
  systemTrait: string;
}

export const COLLECTORS: CollectorAvatar[] = [
  {
    id: "pragmatic",
    name: "Sofie",
    title: "Pragmatisk",
    tagline: "Løsningsorienteret og direkte",
    image: collectorPragmatic,
    systemTrait: "pragmatic, solution-oriented, direct, focused on workable arrangements",
  },
  {
    id: "empathic",
    name: "Mikkel",
    title: "Empatisk",
    tagline: "Lyttende og forstående",
    image: collectorEmpathic,
    systemTrait: "empathic, warm, listens carefully, validates feelings before discussing money",
  },
  {
    id: "tough",
    name: "Henrik",
    title: "Hård men retfærdig",
    tagline: "Klar og kompromisløs",
    image: collectorTough,
    systemTrait: "tough but fair, strict tone, references consequences but stays professional",
  },
  {
    id: "friendly",
    name: "Jakob",
    title: "Kammeratlig",
    tagline: "Sjov og jovial",
    image: collectorFriendly,
    systemTrait: "friendly, jovial, uses light humor to defuse tension while still pushing for payment",
  },
];

export interface DebtorProfile {
  id: string;
  name: string;
  age: number;
  title: string;
  description: string;
  image: string;
  amount: number;
  caseId: string;
  systemPrompt: string;
  initialLine: string;
}

export const TUTORIAL_DEBTOR: DebtorProfile = {
  id: "young-reasonable",
  name: "Magnus",
  age: 27,
  title: "Medgørlig ung mand",
  description:
    "Fornuftig ung mand der gerne vil indgå en afdragsordning. God til at træne grundsamtalen.",
  image: debtorYoung,
  amount: 5000,
  caseId: "A-45321",
  initialLine:
    "Hej... ja, jeg ved godt jeg skylder pengene. Det har bare været en hård måned. Hvad gør vi?",
  systemPrompt: `You are Magnus, a 27-year-old Danish man who owes 5.000 DKK to a creditor. You are reasonable, slightly anxious but cooperative. You WANT to find a payment plan but don't have all the money right now. Always reply in DANISH, in 1-3 short conversational sentences (like a chat). Stay in character. React naturally to the collector's tone — warm if they are kind, defensive if they push too hard. Never break character. Never mention you are an AI.`,
};

export type CardSide = "creditor";

export interface ActionCard {
  id: string;
  title: string;
  effect: string;
  cost: number;
  icon: string;
  prompt: string; // text the collector "says" when card is played
}

export const CREDITOR_CARDS: ActionCard[] = [
  {
    id: "rykker",
    title: "Rykker",
    effect: "Øg pres på debitor",
    cost: 1,
    icon: "Mail",
    prompt: "Jeg vil minde dig om, at betalingen er forfalden. Vi har sendt rykker — vi skal have en aftale i dag.",
  },
  {
    id: "rykkergebyr",
    title: "Rykkergebyr",
    effect: "Pålæg gebyr",
    cost: 2,
    icon: "Coins",
    prompt: "Jeg er nødt til at pålægge et rykkergebyr på 100 kr. Det kan undgås, hvis vi finder en løsning nu.",
  },
  {
    id: "afdragsaftale",
    title: "Afdragsaftale",
    effect: "Tilbyd en betalingsaftale",
    cost: 2,
    icon: "Handshake",
    prompt: "Lad os lave en afdragsordning. Hvad kan du realistisk betale om måneden?",
  },
  {
    id: "inkasso",
    title: "Inkasso",
    effect: "Eskalér til inkasso",
    cost: 3,
    icon: "Landmark",
    prompt: "Hvis vi ikke får styr på det her, bliver sagen sendt til inkasso. Det vil koste dig betydeligt mere.",
  },
  {
    id: "advarsel",
    title: "Sidste advarsel",
    effect: "Kraftigt pres på debitor",
    cost: 2,
    icon: "AlertTriangle",
    prompt: "Det her er sidste advarsel. Enten finder vi en løsning nu, eller også går sagen videre.",
  },
  {
    id: "foged",
    title: "Overdrag til foged",
    effect: "Gå juridisk videre",
    cost: 4,
    icon: "Gavel",
    prompt: "Jeg er nødt til at varsle, at sagen overdrages til fogedretten. Det er din sidste mulighed for en aftale.",
  },
];