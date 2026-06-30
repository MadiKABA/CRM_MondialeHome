"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { duplicateCampaign } from "../server/actions";
import type { CampaignDTO } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaign: CampaignDTO | null;
  onSuccess: (id: string) => void;
}

export function DuplicateCampaignDialog({
  open,
  onOpenChange,
  campaign,
  onSuccess,
}: Props) {
  const [newName, setNewName] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  if (!campaign) return null;

  const defaultName = `Copie de ${campaign.name}`.slice(0, 100);

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const result = await duplicateCampaign({
        campaignId: campaign.id,
        newName: (newName || defaultName).trim(),
      });
      if (result.success && result.data) {
        toast.success("Campagne dupliquée en brouillon");
        setNewName("");
        onSuccess(result.data.id);
      } else if (!result.success) {
        toast.error(result.error ?? "Erreur");
      }
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setNewName("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-text-primary font-serif">
            Dupliquer la campagne
          </DialogTitle>
          <DialogDescription>Copie de &quot;{campaign.name}&quot;</DialogDescription>
        </DialogHeader>
        <Input
          value={newName || defaultName}
          onChange={(e) => setNewName(e.target.value)}
          className="border-cream-darker focus:border-gold"
          autoFocus
        />
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDuplicating}
            className="border-cream-darker hover:bg-cream"
          >
            Annuler
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="bg-gold-deep hover:bg-gold-darker gap-2 text-white"
          >
            {isDuplicating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Copy className="size-4" />
            )}
            Dupliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
