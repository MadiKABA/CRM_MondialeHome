"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteCampaign } from "../server/actions";
import type { CampaignDTO } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaign: CampaignDTO | null;
  onSuccess: () => void;
}

export function DeleteCampaignDialog({ open, onOpenChange, campaign, onSuccess }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!campaign) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteCampaign(campaign.id);
      if (result.success) {
        toast.success("Campagne supprimée");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
              <Trash2 className="size-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-text-primary font-serif">
              Supprimer cette campagne ?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            <strong>&quot;{campaign.name}&quot;</strong> sera supprimée. Cette action est
            réversible uniquement par un administrateur.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isDeleting}
            className="border-cream-darker hover:bg-cream"
          >
            Retour
          </AlertDialogCancel>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 bg-red-600 text-white hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Confirmer la suppression"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
