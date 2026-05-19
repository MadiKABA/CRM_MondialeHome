import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ClientStatusBadgeProps {
  status: string;
  isVip?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Actif",
    className: "bg-gold-light/50 text-gold-darker border-gold-light",
  },
  INACTIVE: {
    label: "Inactif",
    className: "bg-cream text-text-secondary border-cream-darker",
  },
  UNSUBSCRIBED: {
    label: "Désinscrit",
    className: "bg-muted text-muted-foreground border-border",
  },
  BLACKLISTED: { label: "Blacklist", className: "bg-red-50 text-red-700 border-red-200" },
  DELETED: {
    label: "Supprimé",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function ClientStatusBadge({ status, isVip, className }: ClientStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG["INACTIVE"]!;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
        {config.label}
      </Badge>
      {isVip && (
        <Badge className="bg-gold-deep border-0 text-xs font-medium text-white">
          VIP
        </Badge>
      )}
    </div>
  );
}
