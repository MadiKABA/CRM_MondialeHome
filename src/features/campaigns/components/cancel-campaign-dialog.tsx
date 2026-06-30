"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Ban, Loader2 } from "lucide-react";
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
import { cancelCampaign } from "../server/actions";
import type { CampaignDTO } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaign: CampaignDTO | null;
  onSuccess: () => void;
}

export function CancelCampaignDialog({ open, onOpenChange, campaign, onSuccess }: Props) {
  const [isCancelling, setIsCancelling] = useState(false);

  if (!campaign) return null;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const result = await cancelCampaign({ campaignId: campaign.id });
      if (result.success) {
        toast.success("Campagne annulée");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-red-50">
              <Ban className="size-5 text-red-600" />
            </div>
            <AlertDialogTitle className="text-text-primary font-serif">
              Annuler cette campagne ?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            <strong>&quot;{campaign.name}&quot;</strong> sera annulée.
          </AlertDialogDescription>
          {campaign.status === "SENDING" && (
            <p className="mt-1 text-xs text-amber-600">
              ⚠️ Les emails déjà envoyés ne seront pas rappelés.
            </p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isCancelling}
            className="border-cream-darker hover:bg-cream"
          >
            Retour
          </AlertDialogCancel>
          <Button
            onClick={handleCancel}
            disabled={isCancelling}
            className="gap-2 bg-red-600 text-white hover:bg-red-700"
          >
            {isCancelling ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Annulation...
              </>
            ) : (
              "Confirmer l'annulation"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
