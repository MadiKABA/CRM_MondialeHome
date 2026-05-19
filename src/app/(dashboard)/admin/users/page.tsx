import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UsersStats } from "@/features/admin/components/users/users-stats";
import { UsersTable } from "@/features/admin/components/users/users-table";
import { UsersFilters } from "@/features/admin/components/users/users-filters";
import { UsersHeaderActions } from "@/features/admin/components/users/users-header";
import { getUsers, getAdminStats } from "@/features/admin/server/queries/users.queries";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/permissions/server";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}

export const metadata = {
  title: "Membres de l'équipe — Administration",
};

export default async function UsersPage({ searchParams }: PageProps) {
  await requireAuth();

  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const isActive =
    params.status === "active" ? true : params.status === "inactive" ? false : undefined;

  const [{ data: users, total, totalPages }, stats, roles] = await Promise.all([
    getUsers({
      search: params.search,
      roleSlug: params.role,
      isActive,
      page,
      pageSize: 20,
    }),
    getAdminStats(),
    db.role.findMany({
      select: { id: true, slug: true, name: true },
      orderBy: { priority: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-text-primary font-heading text-2xl font-bold">
            {"Membres de l'équipe"}
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Gérez les utilisateurs qui ont accès à votre CRM ({total} membre
            {total > 1 ? "s" : ""})
          </p>
        </div>
        <UsersHeaderActions roles={roles} pendingInvitations={stats.pendingInvitations} />
      </div>

      {/* Stats */}
      <UsersStats stats={stats} />

      {/* Filtres + Tableau */}
      <div className="space-y-4">
        <UsersFilters roles={roles} />
        <UsersTable users={users} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-text-secondary text-sm">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cream-darker"
                  render={
                    <Link
                      href={`/admin/users?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                    />
                  }
                >
                  Précédent
                </Button>
              )}
              {page < totalPages && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-cream-darker"
                  render={
                    <Link
                      href={`/admin/users?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                    />
                  }
                >
                  Suivant
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
