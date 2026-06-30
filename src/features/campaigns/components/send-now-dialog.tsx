"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send, Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sendCampaign } from "../server/actions";
import type { CampaignDTO } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  campaign: CampaignDTO;
  onSuccess: () => void;
}

export function SendNowDialog({ open, onOpenChange, campaign, onSuccess }: Props) {
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    try {
      const result = await sendCampaign({ campaignId: campaign.id });
      if (result.success && result.data) {
        toast.success(`Envoi lancé vers ${result.data.queued} destinataires`, {
          description: `Temps estimé : ~${result.data.estimatedTime}s`,
        });
        onSuccess();
      } else if (!result.success) {
        toast.error(result.error);
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <div className="bg-gold-light/40 flex size-10 items-center justify-center rounded-full">
              <Send className="text-gold-deep size-5" />
            </div>
            <DialogTitle className="text-text-primary font-serif">
              Envoyer la campagne ?
            </DialogTitle>
          </div>
          <DialogDescription>
            <strong>{campaign.segmentCount} client(s)</strong> du segment{" "}
            <strong>{campaign.segmentName}</strong> vont recevoir cet email.
          </DialogDescription>
          <p className="mt-2 flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="size-3.5" />
            Cette action est irréversible.
          </p>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
            className="border-cream-darker hover:bg-cream"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="bg-gold-deep hover:bg-gold-darker gap-2 text-white"
          >
            {isSending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Envoyer maintenant
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
