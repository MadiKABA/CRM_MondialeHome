import { cn } from "@/lib/utils";
import type { SmsMessageAnalysis } from "@/lib/sms/character-counter";

interface SmsCharacterMeterProps {
  analysis: SmsMessageAnalysis;
}

export function SmsCharacterMeter({ analysis }: SmsCharacterMeterProps) {
  const { charCount, smsCount, costPerClient, hasSpecialChars, warning } = analysis;

  const severity = charCount > 306 ? "danger" : charCount > 160 ? "warning" : "ok";

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span
          className={cn(
            "font-mono font-medium",
            severity === "danger"
              ? "text-red-600"
              : severity === "warning"
                ? "text-amber-600"
                : "text-text-secondary"
          )}
        >
          {charCount} / 160 caractères
        </span>
        <span className="text-text-muted">
          {smsCount || 0} SMS · {costPerClient} FCFA / client
        </span>
        {hasSpecialChars && (
          <span className="text-amber-600">
            Caractères spéciaux détectés — limite réduite à 70 car./SMS
          </span>
        )}
      </div>

      {warning && (
        <p
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-[11px]",
            severity === "danger"
              ? "bg-red-50 text-red-700"
              : "bg-amber-50 text-amber-700"
          )}
        >
          {warning}
        </p>
      )}
    </div>
  );
}
