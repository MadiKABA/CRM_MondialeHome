import Link from "next/link";
import { Suspense } from "react";
import { Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getClients,
  getDistinctLocations,
  getAllTags,
  getSellers,
} from "@/features/clients/server/queries";
import { clientFiltersSchema } from "@/features/clients/schemas/client.schema";
import { ClientsStats } from "@/features/clients/components/clients-stats";
import { ClientsFilters } from "@/features/clients/components/clients-filters";
import { ClientsTable } from "@/features/clients/components/clients-table";
import { ClientsPagination } from "@/features/clients/components/clients-pagination";
import { ExportButton } from "@/features/clients/components/export/export-button";

interface ClientsPageProps {
  searchParams: Promise<Record<string, string>>;
}

export const metadata = { title: "Clients — Mondial Home CRM" };

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const filters = clientFiltersSchema.parse(params);

  const [data, locations, tags, sellers] = await Promise.all([
    getClients(filters),
    getDistinctLocations(),
    getAllTags(),
    getSellers(),
  ]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Clients</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Gérez votre base de {data.stats.total.toLocaleString("fr-FR")} clients
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton
            count={data.total}
            filters={{
              search: params.search ?? "",
              city: params.city ?? "",
              status: params.status ?? "",
            }}
          />
          <Button
            variant="outline"
            className="border-cream-darker text-text-secondary hover:bg-cream"
            render={<Link href="/clients/import" />}
          >
            <Upload className="size-4" />
            Importer
          </Button>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            render={<Link href="/clients/new" />}
          >
            <Plus className="size-4" />
            Nouveau client
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ClientsStats
        total={data.stats.total}
        active={data.stats.active}
        vip={data.stats.vip}
        newThisMonth={data.stats.newThisMonth}
      />

      {/* Filtres */}
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <ClientsFilters
          cities={locations.cities}
          sources={locations.sources}
          tags={tags.map((t) => t.tag)}
          defaultSearch={params.search}
          defaultCity={params.city}
          defaultStatus={params.status}
          defaultSource={params.source}
          defaultTag={params.tag}
          defaultAssigned={params.assigned as "me" | "all" | undefined}
        />
      </Suspense>

      {/* Tableau */}
      <ClientsTable
        clients={data.clients}
        sellers={sellers}
        existingTags={tags.map((t) => t.tag)}
      />

      {/* Pagination */}
      <ClientsPagination
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        limit={filters.limit}
      />
    </div>
  );
}
