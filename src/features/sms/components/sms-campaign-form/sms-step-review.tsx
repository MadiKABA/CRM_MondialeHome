import { Users, MessageSquare, Coins, Clock, Send } from "lucide-react";
import { analyzeMessage } from "@/lib/sms/character-counter";
import { personalizeSmsMessage } from "@/lib/sms/personalizer";
import type { SmsCampaignFormState, SmsSegmentDTO } from "../../types";

interface Props {
  state: SmsCampaignFormState;
  segment: SmsSegmentDTO | undefined;
  eligibleCount: number;
}

export function SmsStepReview({ state, segment, eligibleCount }: Props) {
  const analysis = analyzeMessage(state.content);
  const totalCost = analysis.costPerClient * eligibleCount;
  const finalMessage = personalizeSmsMessage(
    state.content,
    { firstName: "Mamadou" },
    { produit: state.produit, reduction: state.reduction }
  );

  const rows = [
    {
      Icon: Users,
      label: "Segment",
      value: `${segment?.name ?? "—"} (${eligibleCount} clients éligibles)`,
    },
    {
      Icon: MessageSquare,
      label: "Message",
      value: `${analysis.charCount} caractères · ${analysis.smsCount} SMS par client`,
    },
    {
      Icon: Coins,
      label: "Coût total estimé",
      value: `${eligibleCount} × ${analysis.costPerClient} FCFA = ${totalCost.toLocaleString("fr-FR")} FCFA`,
    },
    {
      Icon: state.scheduledAt ? Clock : Send,
      label: "Envoi",
      value: state.scheduledAt
        ? new Date(state.scheduledAt).toLocaleString("fr-FR", {
            dateStyle: "long",
            timeStyle: "short",
          })
        : "Immédiatement après création",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-text-primary mb-1 font-serif text-lg font-semibold">
          Récapitulatif
        </h2>
        <p className="text-text-muted text-sm">
          Vérifiez les informations avant de créer la campagne
        </p>
      </div>

      <div className="border-cream-darker bg-cream/30 rounded-xl border p-4">
        <p className="text-text-primary text-sm font-semibold">{state.name}</p>
        {state.description && (
          <p className="text-text-muted mt-1 text-xs">{state.description}</p>
        )}
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <row.Icon className="text-gold-deep mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-text-muted text-xs">{row.label}</p>
              <p className="text-text-primary text-sm font-medium">{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl rounded-bl-sm bg-[#E7FFDB] px-4 py-2.5 text-sm break-words text-gray-800 shadow-sm">
        {finalMessage}
      </div>

      {!state.scheduledAt && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs text-amber-800">
            ⚠️ Cette campagne sera envoyée immédiatement dès sa création. Cliquez sur
            &quot;Créer la campagne&quot; pour confirmer.
          </p>
        </div>
      )}
    </div>
  );
}
