"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MessageSquare,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { updateClientConsent } from "../server/actions";
import type { ConsentLogDTO } from "../types";

interface ConsentSectionProps {
  clientId: string;
  smsConsent: boolean;
  whatsappConsent: boolean;
  emailConsent: boolean;
  consentLogs: ConsentLogDTO[];
}

const CHANNEL_CONFIG = {
  sms: { label: "SMS", Icon: Phone },
  whatsapp: { label: "WhatsApp", Icon: MessageSquare },
  email: { label: "Email", Icon: Mail },
} as const;

type Channel = keyof typeof CHANNEL_CONFIG;

interface PendingChange {
  channel: Channel;
  newValue: boolean;
}

export function ConsentSection({
  clientId,
  smsConsent,
  whatsappConsent,
  emailConsent,
  consentLogs,
}: ConsentSectionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showHistory, setShowHistory] = useState(false);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const [reason, setReason] = useState("");

  const consents: Record<Channel, boolean> = {
    sms: smsConsent,
    whatsapp: whatsappConsent,
    email: emailConsent,
  };

  const handleToggle = (channel: Channel, newValue: boolean) => {
    if (!newValue) {
      // Désactiver → confirmation requise
      setPendingChange({ channel, newValue });
      setReason("");
    } else {
      // Activer → direct
      applyChange(channel, true, "");
    }
  };

  const applyChange = (channel: Channel, value: boolean, reasonText: string) => {
    startTransition(async () => {
      const result = await updateClientConsent({
        clientId,
        channel,
        consent: value,
        reason: reasonText,
      });
      if (result.success) {
        toast.success(
          value
            ? `Consentement ${CHANNEL_CONFIG[channel].label} activé`
            : `Consentement ${CHANNEL_CONFIG[channel].label} désactivé`
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
      setPendingChange(null);
      setReason("");
    });
  };

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {(["sms", "whatsapp", "email"] as Channel[]).map((channel) => {
            const { label, Icon } = CHANNEL_CONFIG[channel];
            const enabled = consents[channel];
            return (
              <div
                key={channel}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-3",
                  enabled
                    ? "border-gold-light/50 bg-gold-light/10"
                    : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className={cn(
                      "size-4",
                      enabled ? "text-gold-deep" : "text-text-secondary"
                    )}
                  />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs",
                      enabled ? "text-gold-darker" : "text-text-secondary"
                    )}
                  >
                    {enabled ? "Activé" : "Désactivé"}
                  </span>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(v) => handleToggle(channel, v)}
                    disabled={isPending}
                    aria-label={`Consentement ${label}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Toggle historique */}
        {consentLogs.length > 0 && (
          <button
            type="button"
            className="text-text-secondary hover:text-foreground flex items-center gap-1 text-xs"
            onClick={() => setShowHistory((v) => !v)}
          >
            {showHistory ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
            {showHistory ? "Masquer" : "Voir"} l&apos;historique ({consentLogs.length})
          </button>
        )}

        {/* Historique */}
        {showHistory && consentLogs.length > 0 && (
          <div className="border-border rounded-lg border">
            <div className="divide-border divide-y">
              {consentLogs.map((log) => {
                const { label, Icon } = CHANNEL_CONFIG[log.channel as Channel] ?? {
                  label: log.channel,
                  Icon: Phone,
                };
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 px-3 py-2.5 text-sm"
                  >
                    <Icon className="text-text-secondary mt-0.5 size-3.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{label}</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-xs font-medium",
                            log.consent
                              ? "bg-gold-light/40 text-gold-darker"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {log.consent ? "Opt-in" : "Opt-out"}
                        </span>
                        {log.source && (
                          <span className="text-text-secondary text-xs">
                            {log.source}
                          </span>
                        )}
                      </div>
                      {log.reason && (
                        <p className="text-text-secondary mt-0.5 text-xs">{log.reason}</p>
                      )}
                    </div>
                    <span className="text-text-secondary shrink-0 text-xs tabular-nums">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dialog de confirmation pour désactivation */}
      <Dialog
        open={!!pendingChange && !pendingChange.newValue}
        onOpenChange={(open) => !open && setPendingChange(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Désactiver le consentement{" "}
              {pendingChange
                ? CHANNEL_CONFIG[pendingChange.channel as Channel]?.label
                : ""}{" "}
              ?
            </DialogTitle>
            <DialogDescription>
              Ce client ne recevra plus de{" "}
              {pendingChange === null
                ? ""
                : pendingChange.channel === "sms"
                  ? "SMS"
                  : pendingChange.channel === "whatsapp"
                    ? "messages WhatsApp"
                    : "emails"}{" "}
              de la part de Mondial Home.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="consent-reason">Motif (optionnel)</Label>
            <Textarea
              id="consent-reason"
              placeholder="Ex : Demande du client, désinscription…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="border-border resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingChange(null)}
              className="border-cream-darker hover:bg-cream"
            >
              Annuler
            </Button>
            <Button
              onClick={() =>
                pendingChange && applyChange(pendingChange.channel, false, reason)
              }
              disabled={isPending}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Désactiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
