import {
  Mail, Coins, Handshake, Landmark, AlertTriangle, Gavel,
  ShieldAlert, Heart, Ear, HelpCircle, FileText, Wallet, Clock,
  CreditCard, Calculator, AlertOctagon, Timer, Scale, ThumbsUp, ListChecks,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Mail, Coins, Handshake, Landmark, AlertTriangle, Gavel,
  ShieldAlert, Heart, Ear, HelpCircle, FileText, Wallet, Clock,
  CreditCard, Calculator, AlertOctagon, Timer, Scale, ThumbsUp, ListChecks,
  Sparkles,
};

export function CardIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Mail;
  return <Icon className={className} />;
}