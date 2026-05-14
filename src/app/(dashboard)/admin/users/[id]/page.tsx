import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserDetail } from "@/features/admin/components/users/user-detail";
import { UserRolesSection } from "@/features/admin/components/users/user-roles-section";
import { UserEffectivePermissions } from "@/features/admin/components/users/user-effective-permissions";
import { UserSessionsSection } from "@/features/admin/components/users/user-sessions-section";
import { getUserById } from "@/features/admin/server/queries/users.queries";
import { getUserSessions } from "@/features/admin/server/queries/sessions.queries";
import { getEffectivePermissions } from "@/features/admin/lib/permissions";
import { requireAuth } from "@/lib/permissions/server";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const user = await getUserById(id);
  return {
    title: user ? `${user.name} — Administration` : "Utilisateur introuvable",
  };
}

export default async function UserDetailPage({ params }: PageProps) {
  await requireAuth();

  const { id } = await params;

  const [user, sessions, effectivePermsSet] = await Promise.all([
    getUserById(id),
    getUserSessions(id),
    getEffectivePermissions(id),
  ]);

  if (!user) notFound();

  const effectivePermissions = effectivePermsSet.has("*")
    ? ["*"]
    : Array.from(effectivePermsSet);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-secondary hover:text-text-primary gap-1.5 text-sm"
          render={<Link href="/admin/users" />}
        >
          <ChevronLeft className="size-4" />
          Membres de l&apos;équipe
        </Button>
      </div>

      {/* Section 1 — Informations */}
      <UserDetail user={user} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Section 2 — Profils d'accès */}
        <UserRolesSection
          userId={user.id}
          roles={user.roles}
          isSuperAdmin={user.isSuperAdmin}
        />

        {/* Section 3 — Connexions actives */}
        <UserSessionsSection sessions={sessions} userId={user.id} />
      </div>

      {/* Section 4 — Ce que cette personne peut faire */}
      <UserEffectivePermissions
        effectivePermissions={effectivePermissions}
        isSuperAdmin={user.isSuperAdmin}
      />

      {/* Section 5 — Zone de danger */}
      {!user.isSuperAdmin && (
        <div className="rounded-xl border border-red-200 p-6">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertTriangle className="size-4" />
            Zone de danger
          </h3>
          <p className="text-text-secondary mb-4 text-xs">
            Ces actions sont irréversibles. Procédez avec précaution.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              {user.isActive ? "Désactiver le compte" : "Réactiver le compte"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Supprimer définitivement
            </Button>
          </div>
        </div>
      )}

      {user.isSuperAdmin && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <p className="flex items-center gap-2 text-xs text-amber-800">
            <AlertTriangle className="size-4 shrink-0" />
            Ce compte est Super Administrateur. La désactivation et la suppression sont
            protégées pour garantir qu&apos;il reste toujours au moins un administrateur
            actif.
          </p>
        </div>
      )}
    </div>
  );
}
