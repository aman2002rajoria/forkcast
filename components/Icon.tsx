import {
  Building2, Carrot, CircleHelp, Eye, Flame, IndianRupee, Leaf, MapPin, ShieldAlert, Timer, TriangleAlert, Users,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = { Building2, Carrot, CircleHelp, Eye, Flame, IndianRupee, Leaf, MapPin, ShieldAlert, Timer, TriangleAlert, Users };

export function Icon({ name, size = 14 }: { name: string; size?: number }) {
  const C = MAP[name] ?? CircleHelp;
  return <C size={size} strokeWidth={1.75} aria-hidden />;
}
