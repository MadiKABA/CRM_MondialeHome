"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Mail, Clock, CheckCircle2, XCircle, Ban, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  revokeInvitation,
  resendInvitation,
} from "@/features/admin/server/actions/invitations.actions";
import type { InvitationDTO } from "@/features/admin/types";
import type { InvitationStatus } from "@prisma/client";

interface InvitationsTableProps {
  invitations: InvitationDTO[];
}

const STATUS_CONFIG: Record<
  InvitationStatus,
  { label: string; Icon: typeof Mail; className: string }
> = {
  PENDING: {
    label: "En attente",
    Icon: Clock,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  ACCEPTED: {
    label: "Acceptée",
    Icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  EXPIRED: {
    label: "Expirée",
    Icon: XCircle,
    className: "border-cream-darker bg-cream text-text-secondary",
  },
  REVOKED: {
    label: "Révoquée",
    Icon: Ban,
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export function InvitationsTable({ invitations }: InvitationsTableProps) {
  async function handleRevoke(invitationId: string) {
    const result = await revokeInvitation({ invitationId });
    if (result.success) {
      toast.success("Invitation révoquée.");
    } else {
      toast.error(result.error);
    }
  }

  async function handleResend(invitationId: string) {
    const result = await resendInvitation(invitationId);
    if (result.success) {
      toast.success("Invitation renvoyée.");
    } else {
      toast.error(result.error);
    }
  }

  if (invitations.length === 0) {
    return (
      <div className="border-cream-darker rounded-xl border py-16 text-center">
        <Mail className="text-text-secondary mx-auto mb-3 size-10 opacity-40" />
        <p className="text-text-secondary text-sm">Aucune invitation</p>
      </div>
    );
  }

  return (
    <div className="border-cream-darker overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-cream/40 border-cream-darker border-b">
            <th className="text-text-secondary px-4 py-3 text-left font-medium">Email</th>
            <th className="text-text-secondary px-4 py-3 text-left font-medium">
              Profil assigné
            </th>
            <th className="text-text-secondary px-4 py-3 text-left font-medium">
              Invité par
            </th>
            <th className="text-text-secondary px-4 py-3 text-left font-medium">
              Statut
            </th>
            <th className="text-text-secondary px-4 py-3 text-left font-medium">Date</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-cream-darker divide-y">
          {invitations.map((inv) => {
            const { label, Icon, className } = STATUS_CONFIG[inv.status];
            const isPending = inv.status === "PENDING";

            return (
              <tr key={inv.id} className="hover:bg-cream/20 transition-colors">
                <td className="text-text-primary px-4 py-3 font-medium">{inv.email}</td>
                <td className="text-text-secondary px-4 py-3">
                  {inv.role?.name ?? <span className="italic">Aucun</span>}
                </td>
                <td className="text-text-secondary px-4 py-3">{inv.invitedBy.name}</td>
                <td className="px-4 py-3">
                  <Badge className={`gap-1 text-xs ${className}`}>
                    <Icon className="size-3" />
                    {label}
                  </Badge>
                </td>
                <td className="text-text-secondary px-4 py-3 text-xs">
                  {formatDistanceToNow(inv.createdAt, { addSuffix: true, locale: fr })}
                </td>
                <td className="px-4 py-3">
                  {isPending && (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-text-secondary hover:text-text-primary h-7 gap-1 text-xs"
                        onClick={() => handleResend(inv.id)}
                      >
                        <RotateCcw className="size-3" />
                        Renvoyer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleRevoke(inv.id)}
                      >
                        Révoquer
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
