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

  const [sale, canReadAll, canUpdate, canCancel] = await Promise.all([
    getSaleById(id),
    hasPermission("sales.read.all"),
    hasPermission("sales.update.all"),
    hasPermission("sales.cancel.all"),
  ]);

  if (!sale) notFound();

  const canReadOwn = await hasPermission("sales.read.own");
  const isOwnSale = sale.sellerId === session.user.id;

  if (!canReadAll && !(canReadOwn && isOwnSale)) redirect("/sales");

  return <SaleDetail sale={sale} canUpdate={canUpdate} canCancel={canCancel} />;
}
