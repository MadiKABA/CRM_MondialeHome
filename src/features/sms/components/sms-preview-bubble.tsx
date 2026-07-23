import { MessageSquare } from "lucide-react";
import { personalizeSmsMessage } from "@/lib/sms/personalizer";

interface SmsPreviewBubbleProps {
  message: string;
  produit?: string | null;
  reduction?: string | null;
}

const PREVIEW_CLIENT = { firstName: "Mamadou" };
const DEFAULT_PREVIEW_VARS = { produit: "Canapé Oslo", reduction: "20" };

export function SmsPreviewBubble({ message, produit, reduction }: SmsPreviewBubbleProps) {
  const campaignVars = {
    produit: produit || DEFAULT_PREVIEW_VARS.produit,
    reduction: reduction || DEFAULT_PREVIEW_VARS.reduction,
  };
  const rendered = personalizeSmsMessage(message, PREVIEW_CLIENT, campaignVars);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gray-100 p-6">
      {rendered.trim() ? (
        <div className="max-w-[280px] rounded-2xl rounded-bl-sm bg-[#E7FFDB] px-4 py-2.5 text-sm break-words text-gray-800 shadow-sm">
          {rendered}
        </div>
      ) : (
        <div className="text-center">
          <MessageSquare className="text-text-muted mx-auto mb-2 size-8" />
          <p className="text-text-muted text-sm">Rédigez le message</p>
          <p className="text-text-muted mt-1 text-xs">La prévisualisation apparaît ici</p>
        </div>
      )}
      {rendered.trim() && (
        <p className="text-text-muted mt-3 text-[11px]">
          Aperçu avec le prénom Mamadou à titre d&apos;exemple
          {!produit && !reduction ? " (produit et réduction fictifs)" : ""}
        </p>
      )}
    </div>
  );
}
