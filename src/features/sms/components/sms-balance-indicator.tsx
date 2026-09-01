"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { getSmsBalance } from "../server/actions";

const EUR_PER_SMS = 0.03;
const XOF_PER_EUR = 655.96;

type BalanceLevel = "ok" | "warning" | "low";

function levelFor(amount: number): BalanceLevel {
  if (amount < 5) return "low";
  if (amount < 20) return "warning";
  return "ok";
}

const LEVEL_STYLES: Record<
  BalanceLevel,
  { border: string; bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  ok: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    icon: CheckCircle2,
  },
  warning: {
    border: "border-gold-light",
    bg: "bg-cream",
    text: "text-gold-darker",
    icon: AlertTriangle,
  },
  low: {
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: XCircle,
  },
};

export function SmsBalanceIndicator() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error" }
    | { status: "ready"; amount: number; currency: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    getSmsBalance().then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setState({
          status: "ready",
          amount: result.data.amount,
          currency: result.data.currency,
        });
      } else {
        setState({ status: "error" });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="border-cream-darker h-16 animate-pulse rounded-xl border bg-white" />
    );
  }

  if (state.status === "error") {
    return null;
  }

  const level = levelFor(state.amount);
  const { border, bg, text, icon: Icon } = LEVEL_STYLES[level];
  const estimatedSms = Math.floor(state.amount / EUR_PER_SMS);
  const estimatedFcfa = Math.round(state.amount * XOF_PER_EUR);

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border ${border} ${bg} p-4`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`size-5 shrink-0 ${text}`} />
        <div>
          <p className={`text-sm font-semibold ${text}`}>
            Solde SMS : {state.amount.toFixed(2)} {state.currency}
            {" · "}
            {estimatedFcfa.toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-text-muted text-xs">
            {level === "ok" && `~${estimatedSms.toLocaleString("fr-FR")} SMS disponibles`}
            {level === "warning" && "Pensez à recharger bientôt"}
            {level === "low" && "Recharger avant d'envoyer"}
          </p>
        </div>
      </div>
      {level === "low" && (
        <a
          href="https://www.mtarget.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-deep hover:text-gold-darker shrink-0 text-sm font-medium underline"
        >
          Recharger sur Mtarget →
        </a>
      )}
    </div>
  );
}
