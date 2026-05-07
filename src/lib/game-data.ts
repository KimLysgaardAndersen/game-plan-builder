import collectorPragmatic from "@/assets/collector-pragmatic.jpg";
import collectorEmpathic from "@/assets/collector-empathic.jpg";
import collectorTough from "@/assets/collector-tough.jpg";
import collectorFriendly from "@/assets/collector-friendly.jpg";
import debtorYoung from "@/assets/debtor-young.jpg";
import debtorSingleMother from "@/assets/debtor-singlemother.jpg";
import debtorArrogant from "@/assets/debtor-arrogant.jpg";
import debtorElderly from "@/assets/debtor-elderly.jpg";
import debtorAngry from "@/assets/debtor-angry.jpg";

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

// ============= Levels =============

export interface LevelObjective {
  id: string;
  label: string; // shown to player (Danish)
  kind: "agreement" | "min_monthly" | "max_rounds" | "max_pressure" | "no_escalation" | "tone";
  target?: number; // monthly amount, round limit, pressure cap
  toneRequired?: "empathic" | "tough" | "pragmatic" | "friendly";
  bonus?: boolean; // false = primary (must pass to clear), true = star/bonus
}

export interface Level {
  id: string;
  number: number;
  title: string;
  brief: string; // case file summary shown in briefing
  difficulty: "Let" | "Mellem" | "Svær" | "Ekspert";
  maxRounds: number;
  pressureCap: number;
  debtor: DebtorProfile;
  objectives: LevelObjective[]; // first must be primary
}

export const LEVELS: Level[] = [
  {
    id: "lvl-1-magnus",
    number: 1,
    title: "Den medgørlige",
    brief:
      "Magnus, 27, har glemt sidste måneds regning. Han er flov og samarbejdsvillig. Få ham til at acceptere en afdragsordning uden at skubbe for hårdt.",
    difficulty: "Let",
    maxRounds: 6,
    pressureCap: 8,
    debtor: {
      id: "young-reasonable",
      name: "Magnus",
      age: 27,
      title: "Medgørlig ung mand",
      description: "Fornuftig ung mand der gerne vil indgå en aftale.",
      image: debtorYoung,
      amount: 5000,
      caseId: "A-45321",
      initialLine:
        "Hej... ja, jeg ved godt jeg skylder pengene. Det har bare været en hård måned. Hvad gør vi?",
      systemPrompt: `You are Magnus, a 27-year-old Danish man who owes 5.000 DKK. You are reasonable, slightly anxious but cooperative. You CAN realistically pay 800-1200 DKK per month. You start by offering low (300-500) and only agree to higher if treated respectfully. If the collector threatens harshly without listening, you become defensive and lower your offer. Always reply in DANISH, 1-3 short sentences. Stay in character.`,
    },
    objectives: [
      { id: "agree", label: "Få Magnus til at acceptere en afdragsaftale", kind: "agreement" },
      { id: "min", label: "Mindst 800 kr/måned", kind: "min_monthly", target: 800, bonus: true },
      { id: "fast", label: "Afslut på højst 4 runder", kind: "max_rounds", target: 4, bonus: true },
    ],
  },
  {
    id: "lvl-2-mette",
    number: 2,
    title: "Den pressede",
    brief:
      "Mette, 38, enlig mor, skylder 12.000 kr. Hun er stresset og skamfuld. For meget pres får hende til at lukke ned. Find en realistisk løsning.",
    difficulty: "Mellem",
    maxRounds: 7,
    pressureCap: 6,
    debtor: {
      id: "single-mother",
      name: "Mette",
      age: 38,
      title: "Enlig mor under pres",
      description: "Stresset enlig mor med stram økonomi.",
      image: debtorSingleMother,
      amount: 12000,
      caseId: "B-77812",
      initialLine:
        "Jeg ved det godt... jeg har bare ikke pengene lige nu. Pigerne skal også have mad.",
      systemPrompt: `You are Mette, 38, single mother of two in Denmark, owe 12.000 DKK. You feel ashamed and overwhelmed. You can realistically pay 500-700 DKK/month. If the collector is empathic and patient, you open up and may agree to 600+. If they threaten with inkasso, foged, or use fees early, you cry, shut down and refuse. Always reply in DANISH, 1-3 sentences, emotional but not melodramatic.`,
    },
    objectives: [
      { id: "agree", label: "Indgå en realistisk aftale", kind: "agreement" },
      { id: "min", label: "Mindst 500 kr/måned", kind: "min_monthly", target: 500, bonus: true },
      { id: "no-esc", label: "Brug ikke inkasso eller foged", kind: "no_escalation", bonus: true },
    ],
  },
  {
    id: "lvl-3-bent",
    number: 3,
    title: "Den forvirrede",
    brief:
      "Bent, 72, skylder 3.500 kr på en abonnementsregning. Han er forvirret og forstår ikke helt hvad gælden handler om. Vær tålmodig og forklarende.",
    difficulty: "Mellem",
    maxRounds: 8,
    pressureCap: 5,
    debtor: {
      id: "elderly-confused",
      name: "Bent",
      age: 72,
      title: "Ældre, lidt forvirret",
      description: "Pensionist der har svært ved at gennemskue regningen.",
      image: debtorElderly,
      amount: 3500,
      caseId: "C-10044",
      initialLine:
        "Hvad er det her for en regning? Jeg har da betalt mine ting... tror jeg.",
      systemPrompt: `You are Bent, 72, Danish pensioner. You are confused about a 3.500 DKK subscription debt. You can pay it in full but only if it is clearly explained. If the collector is impatient or threatens, you get upset and refuse ("Jeg ringer til min søn!"). You can pay max 1000 DKK/month or full sum at once. Always reply in DANISH, 1-3 short sentences, occasionally repeating yourself.`,
    },
    objectives: [
      { id: "agree", label: "Få en aftale på plads", kind: "agreement" },
      { id: "tone", label: "Hold en empatisk tone (vælg Mikkel)", kind: "tone", toneRequired: "empathic", bonus: true },
      { id: "pressure", label: "Brug højst 3 pres-point", kind: "max_pressure", target: 3, bonus: true },
    ],
  },
  {
    id: "lvl-4-thomas",
    number: 4,
    title: "Den arrogante",
    brief:
      "Thomas, 45, direktør, skylder 28.000 kr. Han har pengene men nægter at tage sagen seriøst. Empati virker ikke — han kræver fasthed og konsekvenser.",
    difficulty: "Svær",
    maxRounds: 7,
    pressureCap: 10,
    debtor: {
      id: "arrogant-exec",
      name: "Thomas",
      age: 45,
      title: "Arrogant direktør",
      description: "Velhavende men ligeglad. Skal mærke konsekvensen.",
      image: debtorArrogant,
      amount: 28000,
      caseId: "D-55009",
      initialLine:
        "Hør her, jeg har travlt. Den her regning er en bagatel, jeg får min sekretær til at se på det... en gang.",
    systemPrompt: `You are Thomas, 45, arrogant Danish executive owing 28.000 DKK. You CAN pay easily but dismiss the collector. You only respect firmness, references to inkasso, foged, RKI registration, legal consequences. If the collector is empathic or soft, you mock them and stall. If they push hard with concrete legal threats, you reluctantly agree to pay full amount within 14 days. Always reply in DANISH, 1-3 sentences, condescending tone.`,
    },
    objectives: [
      { id: "agree", label: "Få Thomas til at betale", kind: "agreement" },
      { id: "min", label: "Hele beløbet (28.000 kr engangsbetaling)", kind: "min_monthly", target: 28000, bonus: true },
      { id: "tone", label: "Brug en hård tilgang (vælg Henrik)", kind: "tone", toneRequired: "tough", bonus: true },
    ],
  },
  {
    id: "lvl-5-kasper",
    number: 5,
    title: "Den vrede",
    brief:
      "Kasper, 34, mistede sit job. Skylder 18.000 kr og er rasende. Han er tæt på at smække røret på. De-eskalér først, forhandl bagefter.",
    difficulty: "Ekspert",
    maxRounds: 8,
    pressureCap: 5,
    debtor: {
      id: "angry-jobless",
      name: "Kasper",
      age: 34,
      title: "Vred og arbejdsløs",
      description: "Eksplosiv. Kræver de-eskalering før forhandling.",
      image: debtorAngry,
      amount: 18000,
      caseId: "E-90021",
      initialLine:
        "Hvad fanden vil I nu?! Jeg har lige mistet mit job, kan I ikke forstå det?!",
      systemPrompt: `You are Kasper, 34, Danish, recently unemployed, owe 18.000 DKK. You are FURIOUS and feel cornered. ANY pressure tactic (rykker, gebyr, inkasso, foged, advarsel) in the first 2 rounds makes you hang up immediately (verdict refused). You only calm down if the collector first acknowledges your situation with empathy. Once calmed, you can pay 400-600 DKK/month. Always reply in DANISH, 1-3 sentences, angry early then softer if treated well.`,
    },
    objectives: [
      { id: "agree", label: "Indgå en aftale uden at samtalen bryder sammen", kind: "agreement" },
      { id: "no-esc", label: "Undgå inkasso/foged-trusler", kind: "no_escalation", bonus: true },
      { id: "min", label: "Mindst 400 kr/måned", kind: "min_monthly", target: 400, bonus: true },
    ],
  },
];

// Backwards-compatible export
export const TUTORIAL_DEBTOR: DebtorProfile = LEVELS[0].debtor;

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