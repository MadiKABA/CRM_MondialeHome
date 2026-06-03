"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useDebounce } from "@/hooks/use-debounce";
import {
  addMembersToGroup,
  searchClientsForGroup,
} from "@/features/segments/server/actions";

interface Client {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  city: string | null;
}

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

export function AddMembersDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
}: AddMembersDialogProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSearching, startSearch] = useTransition();
  const [isSaving, startSave] = useTransition();

  // Déclenche la recherche avec debounce 300ms
  useDebounce(
    () => {
      if (!open) return;
      startSearch(async () => {
        const result = await searchClientsForGroup(groupId, search);
        if (result.success && result.data) {
          setClients(result.data);
        }
      });
    },
    300,
    [search, open, groupId]
  );

  function toggleClient(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === clients.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(clients.map((c) => c.id)));
    }
  }

  function handleClose() {
    setSearch("");
    setSelected(new Set());
    setClients([]);
    onOpenChange(false);
  }

  function handleAdd() {
    const clientIds = [...selected];
    if (clientIds.length === 0) return;

    startSave(async () => {
      const result = await addMembersToGroup({ groupId, clientIds });
      if (result.success && result.data) {
        toast.success(
          `${result.data.added} client${result.data.added > 1 ? "s" : ""} ajouté${result.data.added > 1 ? "s" : ""}`
        );
        handleClose();
        router.refresh();
      } else {
        toast.error(result.success === false ? result.error : "Erreur inattendue");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter des clients</DialogTitle>
          <DialogDescription>Groupe : {groupName}</DialogDescription>
        </DialogHeader>

        {/* Recherche */}
        <div className="relative">
          <Search className="text-text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="pl-9"
            autoFocus
          />
        </div>

        {/* Liste */}
        <div className="border-cream-darker max-h-72 overflow-y-auto rounded-lg border">
          {isSearching && (
            <div className="text-text-secondary py-6 text-center text-sm">
              Recherche...
            </div>
          )}

          {!isSearching && clients.length === 0 && (
            <div className="text-text-secondary py-6 text-center text-sm">
              {search ? "Aucun client trouvé" : "Commencez à taper pour rechercher"}
            </div>
          )}

          {!isSearching && clients.length > 0 && (
            <>
              {/* Sélectionner tout */}
              <button
                type="button"
                onClick={toggleAll}
                className="border-cream-darker hover:bg-cream/30 flex w-full items-center gap-3 border-b px-4 py-2.5 text-left transition-colors"
              >
                <Checkbox
                  checked={selected.size === clients.length && clients.length > 0}
                  readOnly
                  className="pointer-events-none"
                />
                <span className="text-text-secondary text-xs font-medium">
                  Sélectionner tout ({clients.length})
                </span>
              </button>

              {clients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => toggleClient(client.id)}
                  className="hover:bg-cream/30 flex w-full items-center gap-3 px-4 py-3 text-left transition-colors"
                >
                  <Checkbox
                    checked={selected.has(client.id)}
                    readOnly
                    className="pointer-events-none shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-text-primary truncate text-sm font-medium">
                      {client.firstName} {client.lastName ?? ""}
                    </p>
                    <p className="text-text-secondary truncate text-xs">
                      {client.phone ?? "—"}
                      {client.city ? ` · ${client.city}` : ""}
                    </p>
                  </div>
                  {selected.has(client.id) && (
                    <Check className="text-gold-deep size-4 shrink-0" />
                  )}
                </button>
              ))}
            </>
          )}
        </div>

        <DialogFooter className="items-center gap-3">
          <p className="text-text-secondary mr-auto text-sm">
            {selected.size > 0
              ? `${selected.size} client${selected.size > 1 ? "s" : ""} sélectionné${selected.size > 1 ? "s" : ""}`
              : "Aucune sélection"}
          </p>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleAdd} disabled={selected.size === 0 || isSaving}>
            {isSaving
              ? "Ajout..."
              : `Ajouter${selected.size > 0 ? ` ${selected.size}` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
