"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type GuardedButtonProps = ComponentProps<typeof Button> & {
  /** Permission accordée ? Sinon bouton désactivé + info-bulle. */
  allowed: boolean;
  deniedReason: string;
  children: ReactNode;
};

/**
 * Bouton visible mais désactivé (avec explication) quand l'utilisateur n'a pas
 * la permission. Affichage uniquement : le serveur reste la référence.
 */
export function GuardedButton({
  allowed,
  deniedReason,
  children,
  ...props
}: GuardedButtonProps) {
  if (allowed) return <Button {...props}>{children}</Button>;
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="inline-flex flex-1 cursor-not-allowed" tabIndex={0} />}
      >
        <Button {...props} disabled className="pointer-events-none w-full">
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{deniedReason}</TooltipContent>
    </Tooltip>
  );
}
