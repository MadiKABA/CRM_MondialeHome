import { notFound, redirect } from "next/navigation";
import { getServerSession, hasPermission } from "@/lib/permissions/server";
import { getSaleById } from "@/features/sales/server/queries";
import { SaleDetail } from "@/features/sales/components/sale-detail";

interface SaleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: SaleDetailPageProps) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { id } = await params;

  // Résoudre RBAC avant de charger la vente pour appliquer le filtre ownership en DB
  const [canReadAll, canReadOwn, canUpdate, canCancel] = await Promise.all([
    hasPermission("sales.read.all"),
    hasPermission("sales.read.own"),
    hasPermission("sales.update.all"),
    hasPermission("sales.cancel.all"),
  ]);

  if (!canReadAll && !canReadOwn) redirect("/sales");

  // getSaleById applique le filtre sellerId si le vendeur n'a pas canReadAll
  const sale = await getSaleById(id, session.user.id, canReadAll);

  if (!sale) notFound();

  return <SaleDetail sale={sale} canUpdate={canUpdate} canCancel={canCancel} />;
}
