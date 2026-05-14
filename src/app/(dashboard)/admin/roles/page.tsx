import { Plus } from "lucide-react";
import { requireAuth, checkPermission } from "@/lib/permissions/server";
import { getRoles } from "@/features/admin/server/queries/roles.queries";
import { RoleCard } from "@/features/admin/components/roles/role-card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Profils d'accès — Administration" };

export default async function RolesPage() {
  await requireAuth();
  await checkPermission("admin.roles.read.all");

  const roles = await getRoles();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-text-primary font-heading text-2xl font-bold">
            {"Profils d'accès"}
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            {roles.length} profil{roles.length > 1 ? "s" : ""} — les profils définissent
            ce que chaque membre peut faire dans le CRM.
          </p>
        </div>
        <Button className="bg-gold-deep hover:bg-gold-deep/90 text-cream gap-1.5">
          <Plus className="size-4" />
          Nouveau profil
        </Button>
      </div>

      {/* Bannière info rôles système */}
      <div className="border-cream-darker bg-cream/40 rounded-xl border px-5 py-4">
        <p className="text-text-secondary text-xs leading-relaxed">
          <span className="text-text-primary font-medium">Profils système</span> — les
          profils marqués &quot;Système&quot; sont gérés par l&apos;application et ne
          peuvent pas être supprimés. Leurs droits peuvent être modifiés par le Super
          Administrateur.
        </p>
      </div>

      {/* Grille de cartes */}
      {roles.length === 0 ? (
        <div className="border-cream-darker rounded-xl border py-16 text-center">
          <p className="text-text-secondary text-sm">Aucun profil configuré.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      )}
    </div>
  );
}
