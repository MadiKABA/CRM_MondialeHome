import { cn } from "@/lib/utils";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ICONS,
  type PaymentMethodType,
} from "../types";

interface PaymentMethodBadgeProps {
  method: PaymentMethodType;
  showIcon?: boolean;
  className?: string;
}

export function PaymentMethodBadge({
  method,
  showIcon = true,
  className,
}: PaymentMethodBadgeProps) {
  return (
    <span
      className={cn(
        "bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      {showIcon && <span>{PAYMENT_METHOD_ICONS[method]}</span>}
      {PAYMENT_METHOD_LABELS[method]}
    </span>
  );
}
