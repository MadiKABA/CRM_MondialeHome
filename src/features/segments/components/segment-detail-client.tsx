"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw, UserPlus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentMembers } from "./segment-members";
import { AddMembersDialog } from "./add-members-dialog";
import { DeleteSegmentDialog } from "./delete-segment-dialog";
import { EditGroupDialog } from "./edit-group-dialog";
import { EditSegmentDialog } from "./edit-segment-dialog";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions/constants";
import { refreshSegment } from "@/features/segments/server/actions";
import { cn } from "@/lib/utils";
import type { SegmentDTO, SegmentMemberDTO } from "../types";

interface SegmentDetailClientProps {
  segment: SegmentDTO;
  members: SegmentMemberDTO[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function SegmentDetailClient({
  segment,
  members,
  total,
  totalPages,
  currentPage,
}: SegmentDetailClientProps) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const canUpdate = usePermission(PERMISSIONS.SEGMENTS_UPDATE_ALL);
  const canDelete = usePermission(PERMISSIONS.SEGMENTS_DELETE_ALL);
  const canManageMembers = usePermission(PERMISSIONS.SEGMENTS_MANAGE_MEMBERS_ALL);

  function handleRefresh() {
    startRefresh(async () => {
      const result = await refreshSegment(segment.id);
      if (result.success && result.data) {
        toast.success(
          `Actualisé — ${result.data.memberCount.toLocaleString("fr-FR")} clients`
        );
        router.refresh();
      } else {
        toast.error(result.success === false ? result.error : "Erreur inattendue");
      }
    });
  }

  function handlePageChange(page: number) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(page));
    router.push(url.pathname + url.search);
  }

  return (
    <div className="space-y-4">
      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center gap-2">
        {canUpdate && !segment.isSystem && (
          <Button
            variant="outline"
            size="sm"
            className="border-cream-darker text-text-secondary hover:bg-cream gap-1.5"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="size-4" />
            Modifier
          </Button>
        )}

        {segment.type === "STATIC" && canManageMembers && (
          <Button
            variant="outline"
            size="sm"
            className="border-cream-darker text-text-secondary hover:bg-cream gap-1.5"
            onClick={() => setAddMembersOpen(true)}
          >
            <UserPlus className="size-4" />
            Ajouter des clients
          </Button>
        )}

        {segment.type === "DYNAMIC" && canUpdate && (
          <Button
            variant="outline"
            size="sm"
            className="border-cream-darker text-text-secondary hover:bg-cream gap-1.5"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Actualisation..." : "Actualiser maintenant"}
          </Button>
        )}

        {!segment.isSystem && canDelete && (
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Supprimer
          </Button>
        )}
      </div>

      {/* Membres */}
      <SegmentMembers
        members={members}
        segmentId={segment.id}
        segmentType={segment.type}
        canManageMembers={canManageMembers}
        total={total}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Dialogs */}
      {segment.type === "STATIC" && (
        <AddMembersDialog
          open={addMembersOpen}
          onOpenChange={setAddMembersOpen}
          groupId={segment.id}
          groupName={segment.name}
        />
      )}

      <DeleteSegmentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        segmentId={segment.id}
        segmentName={segment.name}
        memberCount={segment.memberCount}
        onDeleted={() => router.push("/segments")}
      />

      {segment.type === "STATIC" ? (
        <EditGroupDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          segment={segment}
          onSuccess={() => router.refresh()}
        />
      ) : (
        <EditSegmentDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          segment={segment}
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  );
}
