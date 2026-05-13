"use client";

import { useSession } from "@/lib/auth/client";
import { getGreeting, getFirstName, formatTodayFr } from "@/lib/utils/greeting";

export function WelcomeMessage() {
  const { data: session } = useSession();
  const greeting = getGreeting();
  const firstName = getFirstName(session?.user.name);
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
