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
import { sendSmsCampaign } from "../server/actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
  segmentName: string;
  recipientCount: number;
  messagePreview: string;
  costPerClient: number;
  onSent: () => void;
}

export function SmsSendConfirmDialog({
  open,
  onOpenChange,
  campaignId,
  campaignName,
  segmentName,
  recipientCount,
  messagePreview,
  costPerClient,
  onSent,
}: Props) {
  const [isSending, setIsSending] = useState(false);
  const totalCost = costPerClient * recipientCount;

  const handleSend = async () => {
    setIsSending(true);
    try {
      const result = await sendSmsCampaign({ campaignId });
      if (result.success && result.data) {
        toast.success(`Envoi lancé vers ${result.data.queued} destinataires`, {
          description: `Temps estimé : ~${result.data.estimatedTime}s`,
        });
        onSent();
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
              Envoyer &quot;{campaignName}&quot; ?
            </DialogTitle>
          </div>
          <DialogDescription>
            <strong>{recipientCount} client(s)</strong> du segment{" "}
            <strong>{segmentName}</strong> vont recevoir ce SMS.
          </DialogDescription>
        </DialogHeader>

        <div className="border-cream-darker bg-cream/50 rounded-xl border p-3 text-sm text-gray-800">
          {messagePreview}
        </div>

        <p className="text-text-muted text-xs">
          Coût estimé : {recipientCount} × {costPerClient} FCFA ={" "}
          <strong>{totalCost.toLocaleString("fr-FR")} FCFA</strong>
        </p>

        <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
          <AlertTriangle className="size-3.5" />
          Cette action est irréversible.
        </p>

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
                Envoyer {recipientCount} SMS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
