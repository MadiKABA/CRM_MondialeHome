export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Suspense } from "react";
import { auth } from "@/lib/auth/auth";
import { getFullDashboardData } from "@/features/dashboard/server/queries";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { DashboardSkeleton } from "@/features/dashboard/components/dashboard-skeleton";
import type { Period } from "@/features/dashboard/types";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

const VALID_PERIODS: Period[] = ["today", "week", "month", "quarter", "year"];

interface Props {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const { period } = await searchParams;
  const safePeriod: Period = VALID_PERIODS.includes(period as Period)
    ? (period as Period)
    : "month";

  const data = await getFullDashboardData(safePeriod);

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardShell
        data={data}
        period={safePeriod}
        userName={session.user.name ?? session.user.email ?? ""}
      />
    </Suspense>
  );
}
