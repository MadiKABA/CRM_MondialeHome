import Link from "next/link";
import { ChevronRight, Mail } from "lucide-react";
import { requireAuth, checkPermission } from "@/lib/permissions/server";
import { getInvitations } from "@/features/admin/server/queries/invitations.queries";
import { getAvailableRoles } from "@/features/admin/server/queries/users.queries";
import { InvitationsTable } from "@/features/admin/components/users/invitations-table";
import { InviteDialog } from "@/features/admin/components/users/invite-dialog";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Invitations — Administration" };

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function InvitationsPage({ searchParams }: Props) {
  await requireAuth();
  await checkPermission("admin.users.create.all");

  const params = await searchParams;
  const page = Number(params.page ?? 1);

  const [{ data: invitations, total, totalPages }, availableRoles] = await Promise.all([
    getInvitations(page),
    getAvailableRoles(),
  ]);

  return (
    <div className="space-y-6">
      {/* Fil d'ariane */}
      <nav className="text-text-secondary flex items-center gap-1.5 text-sm">
        <Link href="/admin/users" className="hover:text-text-primary transition-colors">
          Membres
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">Invitations</span>
      </nav>

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-text-primary font-heading text-2xl font-bold">
            Invitations
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            {total} invitation{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <InviteDialog availableRoles={availableRoles}>
          <Button className="bg-gold-deep hover:bg-gold-deep/90 text-cream gap-1.5">
            <Mail className="size-4" />
            Envoyer une invitation
          </Button>
        </InviteDialog>
      </div>

      {/* Table */}
      <InvitationsTable invitations={invitations} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/users/invitations?page=${page - 1}`}
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
              href={`/admin/users/invitations?page=${page + 1}`}
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
