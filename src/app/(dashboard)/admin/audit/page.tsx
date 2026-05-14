import Link from "next/link";
import { requireAuth, checkPermission } from "@/lib/permissions/server";
import {
  getAuditLogs,
  getAuditEntities,
} from "@/features/admin/server/queries/audit.queries";
import { AuditLogTable } from "@/features/admin/components/audit/audit-log-table";

export const metadata = { title: "Historique — Administration" };

interface Props {
  searchParams: Promise<{
    page?: string;
    search?: string;
    entity?: string;
    status?: string;
  }>;
}

export default async function AuditPage({ searchParams }: Props) {
  await requireAuth();
  await checkPermission("admin.audit.read.all");

  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const search: string = params.search ?? "";
  const entity: string = params.entity ?? "";
  const status: string = params.status ?? "";

  const [{ data: logs, total, totalPages }, entities] = await Promise.all([
    getAuditLogs({ search, entity, status, page }),
    getAuditEntities(),
  ]);

  function buildHref(overrides: Record<string, string>) {
    const p = new URLSearchParams({
      ...(search && { search }),
      ...(entity && { entity }),
      ...(status && { status }),
      ...overrides,
    });
    return `/admin/audit?${p.toString()}`;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-text-primary font-heading text-2xl font-bold">
          Historique des actions
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          {total} entrée{total > 1 ? "s" : ""} — toutes les actions importantes sont
          enregistrées ici.
        </p>
      </div>

      {/* Filtres */}
      <form method="get" action="/admin/audit" className="flex flex-wrap gap-3">
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Rechercher…"
          className="border-cream-darker text-text-primary bg-background focus:ring-gold-deep rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        />
        <select
          name="entity"
          defaultValue={entity}
          className="border-cream-darker text-text-primary bg-background focus:ring-gold-deep rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        >
          <option value="">Toutes les entités</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="border-cream-darker text-text-primary bg-background focus:ring-gold-deep rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        >
          <option value="">Tous les statuts</option>
          <option value="success">Succès</option>
          <option value="error">Erreur</option>
        </select>
        <button
          type="submit"
          className="bg-gold-deep hover:bg-gold-deep/90 text-cream rounded-lg px-4 py-2 text-sm transition-colors"
        >
          Filtrer
        </button>
        {(search || entity || status) && (
          <Link
            href="/admin/audit"
            className="border-cream-darker text-text-secondary hover:bg-cream rounded-lg border px-3 py-2 text-sm transition-colors"
          >
            Réinitialiser
          </Link>
        )}
      </form>

      {/* Table */}
      <AuditLogTable logs={logs} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={buildHref({ page: String(page - 1) })}
              className="border-cream-darker text-text-secondary hover:bg-cream rounded-lg border px-3 py-1.5 text-sm transition-colors"
            >
              Précédent
            </Link>
          )}
          <span className="text-text-secondary text-sm">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildHref({ page: String(page + 1) })}
              className="border-cream-darker text-text-secondary hover:bg-cream rounded-lg border px-3 py-1.5 text-sm transition-colors"
            >
              Suivant
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
