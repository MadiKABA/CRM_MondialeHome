"use client";

import { useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SmsRecipientDTO } from "../types";

interface Props {
  recipients: SmsRecipientDTO[];
  total: number;
  page: number;
  totalPages: number;
  status?: string | undefined;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  SENT: "Envoyé",
  DELIVERED: "Délivré",
  FAILED: "Échec",
  SKIPPED: "Ignoré",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-green-50 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  SKIPPED: "bg-gray-100 text-gray-500",
};

export function SmsCampaignRecipientsTable({
  recipients,
  total,
  page,
  totalPages,
  status,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const setStatus = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") params.set("rstatus", value);
    else params.delete("rstatus");
    params.delete("rpage");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("rpage", String(newPage));
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  };

  return (
    <div className="border-cream-darker overflow-hidden rounded-xl border bg-white">
      <div className="border-cream-darker flex items-center justify-between gap-3 border-b px-4 py-3">
        <p className="text-text-primary text-sm font-semibold">Destinataires ({total})</p>
        <Select value={status ?? "ALL"} onValueChange={setStatus}>
          <SelectTrigger className="border-border h-8 w-[140px] text-xs">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {recipients.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-text-muted text-sm">Aucun destinataire pour le moment</p>
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream/50 sticky top-0">
              <tr className="text-text-muted text-left text-xs">
                <th className="px-4 py-2 font-medium">Client</th>
                <th className="px-4 py-2 font-medium">Téléphone</th>
                <th className="px-4 py-2 font-medium">Statut</th>
                <th className="px-4 py-2 font-medium">Envoyé</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((r) => (
                <tr key={r.id} className="border-cream-darker border-t">
                  <td className="text-text-primary px-4 py-2.5">{r.clientName ?? "—"}</td>
                  <td className="text-text-secondary px-4 py-2.5 text-xs">{r.phone}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}
                      title={r.errorMessage ?? undefined}
                    >
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="text-text-muted px-4 py-2.5 text-xs">
                    {r.sentAt
                      ? new Date(r.sentAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="border-cream-darker flex items-center justify-end gap-2 border-t px-4 py-2.5">
          <Button
            variant="outline"
            size="sm"
            className="border-border h-8 w-8 p-0"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            aria-label="Page précédente"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-text-secondary text-xs tabular-nums">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-border h-8 w-8 p-0"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
            aria-label="Page suivante"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
