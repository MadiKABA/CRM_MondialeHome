import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, XCircle, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { AuditLogDTO } from "@/features/admin/types";

interface AuditLogTableProps {
  logs: AuditLogDTO[];
}

function getActionLabel(action: string): string {
  const map: Record<string, string> = {
    "user.create": "Création utilisateur",
    "user.update": "Modification utilisateur",
    "user.delete": "Suppression utilisateur",
    "user.activate": "Activation utilisateur",
    "user.deactivate": "Désactivation utilisateur",
    "role.create": "Création profil",
    "role.update": "Modification profil",
    "role.delete": "Suppression profil",
    "role.assign": "Assignation profil",
    "role.remove": "Retrait profil",
    "permission.grant": "Octroi droit",
    "permission.revoke": "Révocation droit",
    "invitation.send": "Invitation envoyée",
    "invitation.revoke": "Invitation révoquée",
    "session.terminate": "Session terminée",
    "auth.login": "Connexion",
    "auth.logout": "Déconnexion",
    "auth.failed": "Échec connexion",
  };
  return map[action] ?? action;
}

function getEntityLabel(entity: string): string {
  const map: Record<string, string> = {
    user: "Utilisateur",
    role: "Profil",
    permission: "Droit",
    invitation: "Invitation",
    session: "Session",
    client: "Client",
    sale: "Vente",
    campaign: "Campagne",
  };
  return map[entity] ?? entity;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AuditLogTable({ logs }: AuditLogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="border-cream-darker rounded-xl border py-16 text-center">
        <FileText className="text-text-secondary mx-auto mb-3 size-10 opacity-40" />
        <p className="text-text-secondary text-sm">
          Aucune entrée dans l&apos;historique
        </p>
      </div>
    );
  }

  return (
    <div className="border-cream-darker overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-cream/40 border-cream-darker border-b">
            <th className="text-text-secondary px-4 py-3 text-left font-medium">
              Action
            </th>
            <th className="text-text-secondary px-4 py-3 text-left font-medium">
              Entité
            </th>
            <th className="text-text-secondary px-4 py-3 text-left font-medium">
              Membre
            </th>
            <th className="text-text-secondary px-4 py-3 text-left font-medium">
              Statut
            </th>
            <th className="text-text-secondary px-4 py-3 text-left font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-cream-darker divide-y">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-cream/20 transition-colors">
              <td className="text-text-primary px-4 py-3 font-medium">
                {getActionLabel(log.action)}
              </td>
              <td className="text-text-secondary px-4 py-3">
                {getEntityLabel(log.entity)}
                {log.entityId && (
                  <span className="text-text-secondary ml-1 font-mono text-[10px] opacity-60">
                    #{log.entityId.slice(0, 8)}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                {log.userName ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="border-cream-darker size-6 border">
                      <AvatarImage src={log.userImage ?? undefined} alt={log.userName} />
                      <AvatarFallback className="bg-gold-light text-gold-deep text-[9px] font-bold">
                        {getInitials(log.userName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-text-primary text-xs">{log.userName}</span>
                  </div>
                ) : (
                  <span className="text-text-secondary text-xs italic">Système</span>
                )}
              </td>
              <td className="px-4 py-3">
                {log.status === "success" ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="size-3.5" />
                    OK
                  </span>
                ) : (
                  <span
                    className="flex items-center gap-1 text-xs text-red-600"
                    title={log.errorMessage ?? undefined}
                  >
                    <XCircle className="size-3.5" />
                    Erreur
                  </span>
                )}
              </td>
              <td className="text-text-secondary px-4 py-3 text-xs">
                {formatDistanceToNow(log.createdAt, { addSuffix: true, locale: fr })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
