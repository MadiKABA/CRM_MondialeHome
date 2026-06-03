"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useState } from "react";
import { removeMemberFromGroup } from "@/features/segments/server/actions";
import { formatCurrency } from "@/lib/utils";
import type { SegmentMemberDTO } from "../types";

interface SegmentMembersProps {
  members: SegmentMemberDTO[];
  segmentId: string;
  segmentType: "STATIC" | "DYNAMIC";
  canManageMembers: boolean;
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function SegmentMembers({
  members,
  segmentId,
  segmentType,
  canManageMembers,
  total,
  page,
  totalPages,
  onPageChange,
}: SegmentMembersProps) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRemove(clientId: string) {
    startTransition(async () => {
      const result = await removeMemberFromGroup({ groupId: segmentId, clientId });
      if (result.success) {
        toast.success("Client retiré du groupe");
        router.refresh();
      } else {
        toast.error(result.success === false ? result.error : "Erreur inattendue");
      }
      setRemovingId(null);
    });
  }

  if (members.length === 0) {
    return (
      <div className="border-cream-darker rounded-xl border border-dashed py-12 text-center">
        <p className="text-text-secondary text-sm">Aucun membre dans ce segment</p>
        {segmentType === "STATIC" && (
          <p className="text-text-muted mt-1 text-xs">
            Utilisez le bouton &ldquo;Ajouter des clients&rdquo; pour commencer
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-text-secondary text-sm">
        {total.toLocaleString("fr-FR")} membre{total !== 1 ? "s" : ""}
      </p>

      <div className="border-cream-darker divide-cream-darker divide-y overflow-hidden rounded-xl border">
        {members.map((m) => (
          <div
            key={m.clientId}
            className="hover:bg-cream/30 flex items-center justify-between gap-3 px-4 py-3 transition-colors"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="bg-gold-light/30 flex size-8 shrink-0 items-center justify-center rounded-full">
                <span className="text-gold-deep text-xs font-semibold">
                  {m.clientName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-text-primary truncate text-sm font-medium">
                    {m.clientName}
                  </span>
                  {m.isVip && <Crown className="text-gold-deep size-3.5 shrink-0" />}
                </div>
                <p className="text-text-secondary text-xs">
                  {m.clientPhone ?? "—"}
                  {m.clientCity ? ` · ${m.clientCity}` : ""}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="text-text-primary text-sm font-medium">
                {formatCurrency(m.totalSpent)}
              </span>
              {segmentType === "STATIC" && canManageMembers && (
                <button
                  type="button"
                  onClick={() => setRemovingId(m.clientId)}
                  className="text-text-muted rounded p-1 transition-colors hover:text-red-600"
                  aria-label="Retirer du groupe"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-text-secondary text-xs">
            Page {page} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-cream-darker text-text-secondary"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-cream-darker text-text-secondary"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!removingId}
        onOpenChange={(open) => {
          if (!open) setRemovingId(null);
        }}
        title="Retirer ce client ?"
        description="Ce client sera retiré du groupe. Vous pourrez le rajouter à tout moment."
        confirmLabel="Retirer"
        onConfirm={() => {
          if (removingId) handleRemove(removingId);
        }}
      />
    </div>
  );
}
