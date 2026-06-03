import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getServerSession, hasPermission } from "@/lib/permissions/server";
import { getSales } from "@/features/sales/server/queries";
import { saleFiltersSchema } from "@/features/sales/schemas/sale.schema";
import { SalesStats } from "@/features/sales/components/sales-stats";
import { SalesFilters } from "@/features/sales/components/sales-filters";
import { SalesList } from "@/features/sales/components/sales-list";
import { Suspense } from "react";

interface SearchParams {
  search?: string;
  status?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
  sortBy?: string;
  sortDir?: string;
}

interface SalesPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const rawParams = await searchParams;

  const [canReadAll, canCreate, canCancel, canExport] = await Promise.all([
    hasPermission("sales.read.all"),
    hasPermission("sales.create.all"),
    hasPermission("sales.cancel.all"),
    hasPermission("sales.export.all"),
  ]);

  const hasReadAccess = canReadAll || (await hasPermission("sales.read.own"));
  if (!hasReadAccess) redirect("/dashboard");

  const filters = saleFiltersSchema.parse({
    search: rawParams.search,
    status: rawParams.status,
    paymentMethod: rawParams.paymentMethod,
    dateFrom: rawParams.dateFrom,
    dateTo: rawParams.dateTo,
    page: rawParams.page ?? "1",
    sortBy: rawParams.sortBy ?? "soldAt",
    sortDir: rawParams.sortDir ?? "desc",
  });

  const { sales, total, totalPages, page, stats } = await getSales(
    filters,
    session.user.id,
    canReadAll
  );

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Ventes</h1>
          <p className="text-muted-foreground text-sm">
            {total} vente{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {canExport && (
            <Button variant="outline" size="sm" render={<Link href="/sales/export" />}>
              <Download className="mr-2 size-4" />
              Exporter
            </Button>
          )}
          {canCreate && (
            <Button size="sm" render={<Link href="/sales/nouvelle" />}>
              <Plus className="mr-2 size-4" />
              Nouvelle vente
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <SalesStats stats={stats} />

      {/* Filtres */}
      <Suspense>
        <SalesFilters />
      </Suspense>

      {/* Liste */}
      <SalesList sales={sales} canCancel={canCancel} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/sales?page=${page - 1}`} />}
            >
              Précédent
            </Button>
          )}
          <span className="text-muted-foreground text-sm">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/sales?page=${page + 1}`} />}
            >
              Suivant
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
