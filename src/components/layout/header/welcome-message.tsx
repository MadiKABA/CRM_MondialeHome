"use client";

import { useSyncExternalStore } from "react";
import { useSession } from "@/lib/auth/client";
import { getGreeting, getFirstName, formatTodayFr } from "@/lib/utils/greeting";

function subscribeNoop() {
  return () => {};
}

export function WelcomeMessage() {
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );

  const { data: session } = useSession();
  const greeting = getGreeting();
  // La session client (better-auth) est déjà hydratée depuis le cache local
  // avant le premier rendu React, contrairement au rendu serveur qui n'a
  // jamais de session — on ignore firstName tant que `mounted` est false
  // pour que le premier rendu client corresponde au HTML serveur.
  const firstName = mounted ? getFirstName(session?.user.name) : "";
  const today = formatTodayFr();

  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-foreground truncate text-sm font-semibold sm:text-base">
        {greeting}
        {firstName ? (
          <>
            , <span className="max-w-[120px] truncate sm:max-w-none">{firstName}</span>{" "}
            <span aria-hidden>👋</span>
          </>
        ) : (
          <span aria-hidden> 👋</span>
        )}
      </p>
      <p className="text-muted-foreground hidden text-xs capitalize sm:block">{today}</p>
    </div>
  );
}
