"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, ChevronDown, Tag, UserCheck, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  bulkUpdateStatus,
  bulkAddTag,
  bulkRemoveTag,
  bulkAssign,
  bulkDeleteClients,
} from "../server/actions";
import type { SellerDTO } from "../types";

type ClientStatus = "ACTIVE" | "INACTIVE" | "UNSUBSCRIBED" | "BLACKLISTED";

interface BulkActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  sellers: SellerDTO[];
  existingTags: string[];
  selectedTags?: string[];
}

type DialogType = "status" | "addTag" | "removeTag" | "assign" | "delete" | null;

const STATUS_OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: "ACTIVE", label: "Actif" },
  { value: "INACTIVE", label: "Inactif" },
  { value: "UNSUBSCRIBED", label: "Désinscrit" },
  { value: "BLACKLISTED", label: "Blacklisté" },
];

export function BulkActionsBar({
  selectedIds,
  onClearSelection,
  sellers,
  existingTags,
  selectedTags = [],
}: BulkActionsBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [openDialog, setOpenDialog] = useState<DialogType>(null);

  // Form state
  const [statusValue, setStatusValue] = useState<ClientStatus>("ACTIVE");
  const [statusReason, setStatusReason] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagToRemove, setTagToRemove] = useState("");
  const [assignTo, setAssignTo] = useState<string>("__none__");
  const [deleteConfirm, setDeleteConfirm] = useState("");

  if (selectedIds.length === 0) return null;

  const closeDialog = () => {
    setOpenDialog(null);
    setStatusReason("");
    setTagInput("");
    setDeleteConfirm("");
  };

  const handleBulkStatus = () => {
    startTransition(async () => {
      const result = await bulkUpdateStatus({
        clientIds: selectedIds,
        status: statusValue,
        reason: statusReason,
      });
      if (result.success) {
        toast.success(`${result.data?.updated ?? selectedIds.length} clients mis à jour`);
        onClearSelection();
        router.refresh();
        closeDialog();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleBulkAddTag = () => {
    const tag = tagInput.toLowerCase().trim();
    if (!tag) return;
    startTransition(async () => {
      const result = await bulkAddTag({ clientIds: selectedIds, tag });
      if (result.success) {
        toast.success(`Tag ajouté à ${result.data?.updated ?? 0} clients`);
        onClearSelection();
        router.refresh();
        closeDialog();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleBulkRemoveTag = () => {
    if (!tagToRemove) return;
    startTransition(async () => {
      const result = await bulkRemoveTag({ clientIds: selectedIds, tag: tagToRemove });
      if (result.success) {
        toast.success(`Tag retiré de ${result.data?.updated ?? 0} clients`);
        onClearSelection();
        router.refresh();
        closeDialog();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleBulkAssign = () => {
    startTransition(async () => {
      const result = await bulkAssign({
        clientIds: selectedIds,
        assignedToId: assignTo === "__none__" ? null : assignTo,
      });
      if (result.success) {
        toast.success(`${result.data?.updated ?? selectedIds.length} clients assignés`);
        onClearSelection();
        router.refresh();
        closeDialog();
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleBulkDelete = () => {
    startTransition(async () => {
      const result = await bulkDeleteClients({
        clientIds: selectedIds,
        confirmation: deleteConfirm,
      });
      if (result.success) {
        toast.success(`${result.data?.deleted ?? selectedIds.length} clients supprimés`);
        onClearSelection();
        router.refresh();
        closeDialog();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <>
      <div className="border-border bg-cream flex flex-wrap items-center gap-2 rounded-lg border px-4 py-2.5">
        <span className="text-text-secondary mr-2 text-sm font-medium">
          <span className="text-foreground font-semibold">{selectedIds.length}</span>{" "}
          client{selectedIds.length > 1 ? "s" : ""} sélectionné
          {selectedIds.length > 1 ? "s" : ""}
        </span>

        {/* Changer statut */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="border-cream-darker hover:bg-white"
                disabled={isPending}
              />
            }
          >
            Changer statut
            <ChevronDown className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => {
                  setStatusValue(opt.value);
                  setStatusReason("");
                  setOpenDialog("status");
                }}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tags */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="border-cream-darker hover:bg-white"
                disabled={isPending}
              />
            }
          >
            <Tag className="size-3.5" />
            Tags
            <ChevronDown className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                setTagInput("");
                setOpenDialog("addTag");
              }}
            >
              Ajouter un tag
            </DropdownMenuItem>
            {selectedTags.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setTagToRemove("");
                    setOpenDialog("removeTag");
                  }}
                >
                  Retirer un tag
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Assigner */}
        {sellers.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="border-cream-darker hover:bg-white"
            disabled={isPending}
            onClick={() => {
              setAssignTo("__none__");
              setOpenDialog("assign");
            }}
          >
            <UserCheck className="size-3.5" />
            Assigner
          </Button>
        )}

        {/* Exporter sélection */}
        <Button
          variant="outline"
          size="sm"
          className="border-cream-darker hover:bg-white"
          disabled={isPending}
          onClick={() => toast.info("Export de la sélection — disponible prochainement")}
        >
          <Download className="size-3.5" />
          Exporter
        </Button>

        <div className="flex-1" />

        {/* Supprimer */}
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={isPending}
          onClick={() => {
            setDeleteConfirm("");
            setOpenDialog("delete");
          }}
        >
          <Trash2 className="size-3.5" />
          Supprimer
        </Button>

        {/* Désélectionner */}
        <Button
          variant="ghost"
          size="sm"
          className="text-text-secondary hover:text-foreground"
          onClick={onClearSelection}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Dialog : Changer statut */}
      <Dialog open={openDialog === "status"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Changer le statut de {selectedIds.length} client
              {selectedIds.length > 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>
              Nouveau statut :{" "}
              <strong>
                {STATUS_OPTIONS.find((o) => o.value === statusValue)?.label}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-status-reason">
              Motif <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="bulk-status-reason"
              placeholder="Motif du changement de statut…"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              rows={3}
              className="border-border resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              className="border-cream-darker hover:bg-cream"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBulkStatus}
              disabled={!statusReason.trim() || isPending}
              className="bg-gold-deep hover:bg-gold-darker text-white"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : Ajouter tag */}
      <Dialog open={openDialog === "addTag"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Ajouter un tag</DialogTitle>
            <DialogDescription>
              Sera ajouté aux {selectedIds.length} clients sélectionnés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-tag-input">Tag</Label>
            <Input
              id="bulk-tag-input"
              placeholder="Ex : revendeur, vip, projet…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value.toLowerCase())}
              onKeyDown={(e) => e.key === "Enter" && handleBulkAddTag()}
              className="border-border"
              list="bulk-tag-suggestions"
            />
            {existingTags.length > 0 && (
              <datalist id="bulk-tag-suggestions">
                {existingTags.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              className="border-cream-darker hover:bg-cream"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBulkAddTag}
              disabled={!tagInput.trim() || isPending}
              className="bg-gold-deep hover:bg-gold-darker text-white"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : Retirer tag */}
      <Dialog open={openDialog === "removeTag"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Retirer un tag</DialogTitle>
            <DialogDescription>
              Sera retiré des {selectedIds.length} clients sélectionnés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-tag-remove">Tag à retirer</Label>
            <Select value={tagToRemove} onValueChange={(v) => setTagToRemove(v ?? "")}>
              <SelectTrigger className="border-border" id="bulk-tag-remove">
                <SelectValue placeholder="Choisir un tag…" />
              </SelectTrigger>
              <SelectContent>
                {selectedTags.length > 0
                  ? selectedTags.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))
                  : existingTags.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              className="border-cream-darker hover:bg-cream"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBulkRemoveTag}
              disabled={!tagToRemove || isPending}
              className="bg-gold-deep hover:bg-gold-darker text-white"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : Assigner */}
      <Dialog open={openDialog === "assign"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assigner un vendeur</DialogTitle>
            <DialogDescription>
              {selectedIds.length} client{selectedIds.length > 1 ? "s" : ""} seront
              assignés au vendeur choisi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-assign-seller">Vendeur</Label>
            <Select value={assignTo} onValueChange={(v) => setAssignTo(v ?? "__none__")}>
              <SelectTrigger className="border-border" id="bulk-assign-seller">
                <SelectValue placeholder="Choisir un vendeur…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Aucun vendeur</SelectItem>
                {sellers.map((seller) => (
                  <SelectItem key={seller.id} value={seller.id}>
                    {seller.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              className="border-cream-darker hover:bg-cream"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={isPending}
              className="bg-gold-deep hover:bg-gold-darker text-white"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog : Supprimer */}
      <Dialog open={openDialog === "delete"} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Supprimer {selectedIds.length} client{selectedIds.length > 1 ? "s" : ""} ?
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Les clients seront archivés et ne pourront
              plus être contactés.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bulk-delete-confirm">
              Tapez{" "}
              <code className="bg-muted rounded px-1 font-mono text-xs font-semibold">
                SUPPRIMER
              </code>{" "}
              pour confirmer
            </Label>
            <Input
              id="bulk-delete-confirm"
              placeholder="SUPPRIMER"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="border-border font-mono"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              className="border-cream-darker hover:bg-cream"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={deleteConfirm !== "SUPPRIMER" || isPending}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
