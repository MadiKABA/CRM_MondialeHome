"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { updateClientStatus } from "../server/actions";

type ClientStatus = "ACTIVE" | "INACTIVE" | "UNSUBSCRIBED" | "BLACKLISTED";

interface StatusChangeDropdownProps {
  clientId: string;
  currentStatus: string;
  clientName: string;
  onSuccess?: () => void;
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "Actif",
    className: "bg-gold-light/50 text-gold-darker border-gold-light",
  },
  INACTIVE: {
    label: "Inactif",
    className: "bg-cream text-text-muted border-cream-darker",
  },
  UNSUBSCRIBED: {
    label: "Désinscrit",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  BLACKLISTED: {
    label: "Blacklisté",
    className: "bg-red-50 text-red-700 border-red-200",
  },
};

const SENSITIVE_STATUSES: ClientStatus[] = ["BLACKLISTED", "UNSUBSCRIBED"];

export function StatusChangeDropdown({
  clientId,
  currentStatus,
  clientName,
  onSuccess,
}: StatusChangeDropdownProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingStatus, setPendingStatus] = useState<ClientStatus | null>(null);
  const [reason, setReason] = useState("");

  const config = STATUS_CONFIG[currentStatus as ClientStatus] ?? STATUS_CONFIG.INACTIVE;

  const handleSelect = (status: ClientStatus) => {
    if (status === currentStatus) return;
    if (SENSITIVE_STATUSES.includes(status)) {
      setPendingStatus(status);
      setReason("");
    } else {
      applyStatus(status, "");
    }
  };

  const applyStatus = (status: ClientStatus, reasonText: string) => {
    startTransition(async () => {
      const result = await updateClientStatus({
        clientId,
        status,
        reason: reasonText,
      });
      if (result.success) {
        toast.success(`Statut mis à jour : ${STATUS_CONFIG[status].label}`);
        router.refresh();
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
      setPendingStatus(null);
      setReason("");
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isPending}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50",
            config.className
          )}
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : config.label}
          <ChevronDown className="size-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            className={cn(
              "cursor-pointer",
              currentStatus === "ACTIVE" && "font-semibold"
            )}
            onClick={() => handleSelect("ACTIVE")}
          >
            <span className="bg-gold-light/50 text-gold-darker mr-2 rounded-full px-2 py-0.5 text-xs">
              Actif
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn(
              "cursor-pointer",
              currentStatus === "INACTIVE" && "font-semibold"
            )}
            onClick={() => handleSelect("INACTIVE")}
          >
            <span className="bg-cream text-text-muted mr-2 rounded-full px-2 py-0.5 text-xs">
              Inactif
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-amber-600 focus:text-amber-700"
            onClick={() => handleSelect("UNSUBSCRIBED")}
          >
            <span className="mr-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
              Désinscrit
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-700"
            onClick={() => handleSelect("BLACKLISTED")}
          >
            <span className="mr-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
              Blacklisté
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogue de confirmation pour les statuts sensibles */}
      <Dialog
        open={!!pendingStatus}
        onOpenChange={(open) => !open && setPendingStatus(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Passer <span className="text-foreground font-semibold">{clientName}</span>{" "}
              en{" "}
              <span
                className={
                  pendingStatus === "BLACKLISTED" ? "text-red-600" : "text-amber-600"
                }
              >
                {pendingStatus ? STATUS_CONFIG[pendingStatus].label : ""}
              </span>{" "}
              ?
            </DialogTitle>
            <DialogDescription>
              {pendingStatus === "BLACKLISTED"
                ? "Ce client ne recevra plus aucune communication de Mondial Home."
                : "Ce client sera désabonné de toutes les communications (SMS, WhatsApp, Email)."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="status-reason">
              Motif <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="status-reason"
              placeholder="Ex : Demande explicite du client, fraude suspectée…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="border-border resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingStatus(null)}
              className="border-cream-darker hover:bg-cream"
            >
              Annuler
            </Button>
            <Button
              onClick={() => pendingStatus && applyStatus(pendingStatus, reason)}
              disabled={!reason.trim() || isPending}
              className={
                pendingStatus === "BLACKLISTED"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-amber-600 text-white hover:bg-amber-700"
              }
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
