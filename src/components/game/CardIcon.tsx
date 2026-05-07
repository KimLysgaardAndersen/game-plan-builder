import { Mail, Coins, Handshake, Landmark, AlertTriangle, Gavel, type LucideIcon } from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  Mail,
  Coins,
  Handshake,
  Landmark,
  AlertTriangle,
  Gavel,
};

export function CardIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Mail;
  return <Icon className={className} />;
}