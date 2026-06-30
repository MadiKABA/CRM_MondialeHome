import { MESSAGE_STATUS_LABELS } from "@/features/email-mass/types";
import type { MessageLogDTO } from "@/features/email-mass/types";

interface Props {
  messages: MessageLogDTO[];
  total: number;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  SENT: "bg-blue-50 text-blue-700",
  DELIVERED: "bg-green-50 text-green-700",
  OPENED: "bg-gold-light/40 text-gold-darker",
  CLICKED: "bg-purple-50 text-purple-700",
  BOUNCED: "bg-red-50 text-red-600",
  FAILED: "bg-red-100 text-red-700",
  SKIPPED: "bg-gray-100 text-gray-500",
};

export function CampaignRecipientsTable({ messages, total }: Props) {
  if (messages.length === 0) {
    return (
      <div className="border-cream-darker rounded-xl border bg-white p-8 text-center">
        <p className="text-text-muted text-sm">Aucun destinataire pour le moment</p>
      </div>
    );
  }

  return (
    <div className="border-cream-darker overflow-hidden rounded-xl border bg-white">
      <div className="border-cream-darker border-b px-4 py-3">
        <p className="text-text-primary text-sm font-semibold">Destinataires ({total})</p>
      </div>
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream/50 sticky top-0">
            <tr className="text-text-muted text-left text-xs">
              <th className="px-4 py-2 font-medium">Client</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Statut</th>
              <th className="px-4 py-2 font-medium">Envoyé</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id} className="border-cream-darker border-t">
                <td className="text-text-primary px-4 py-2.5">{m.clientName ?? "—"}</td>
                <td className="text-text-secondary px-4 py-2.5 text-xs">{m.email}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[m.status] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {MESSAGE_STATUS_LABELS[m.status]}
                  </span>
                </td>
                <td className="text-text-muted px-4 py-2.5 text-xs">
                  {m.sentAt
                    ? new Date(m.sentAt).toLocaleTimeString("fr-FR", {
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
    </div>
  );
}
