import Link from "next/link";
import { Shield, Users, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RoleListItemDTO } from "@/features/admin/types";

interface RoleCardProps {
  role: RoleListItemDTO;
}

// Couleur selon la priorité du rôle
function getPriorityColor(priority: number): string {
  if (priority >= 90) return "bg-amber-100 text-amber-800 border-amber-200";
  if (priority >= 70) return "bg-gold-light/60 text-gold-deep border-gold-light";
  if (priority >= 50) return "bg-cream text-text-secondary border-cream-darker";
  return "bg-cream text-text-secondary border-cream-darker";
}

export function RoleCard({ role }: RoleCardProps) {
  return (
    <div className="border-cream-darker bg-background hover:bg-cream/10 flex flex-col rounded-xl border p-5 transition-colors">
      {/* En-tête */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="bg-gold-light/40 flex size-10 shrink-0 items-center justify-center rounded-full">
          {role.isSystem ? (
            <Lock className="text-gold-deep size-4.5" />
          ) : (
            <Shield className="text-gold-deep size-4.5" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {role.isSystem && (
            <Badge className="border-cream-darker text-text-secondary bg-cream text-[10px]">
              Système
            </Badge>
          )}
          <Badge className={`text-[10px] ${getPriorityColor(role.priority)}`}>
            Priorité {role.priority}
          </Badge>
        </div>
      </div>

      {/* Nom + description */}
      <div className="mb-4 flex-1">
        <h3 className="text-text-primary font-semibold">{role.name}</h3>
        {role.description ? (
          <p className="text-text-secondary mt-1 text-xs leading-relaxed">
            {role.description}
          </p>
        ) : (
          <p className="text-text-secondary mt-1 text-xs italic">Aucune description</p>
        )}
      </div>

      {/* Stats */}
      <div className="mb-4 flex gap-4">
        <div className="flex items-center gap-1.5">
          <Shield className="text-gold-deep size-3.5" />
          <span className="text-text-secondary text-xs">
            {role.permissionCount} droit{role.permissionCount > 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="text-text-secondary size-3.5" />
          <span className="text-text-secondary text-xs">
            {role.userCount} membre{role.userCount > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Action */}
      <Button
        size="sm"
        variant="outline"
        className="border-gold-light text-gold-deep hover:bg-gold-light/20 w-full text-xs"
        render={<Link href={`/admin/roles/${role.id}`} />}
      >
        Voir le profil
      </Button>
    </div>
  );
}
