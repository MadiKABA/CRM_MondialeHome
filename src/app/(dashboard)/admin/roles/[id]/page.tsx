import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Shield, Users, Lock, Copy, Trash2 } from "lucide-react";
import { requireAuth, checkPermission } from "@/lib/permissions/server";
import { getRoleById } from "@/features/admin/server/queries/roles.queries";
import { PermissionsMatrix } from "@/features/admin/components/roles/permissions-matrix";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Configuration du profil — Administration" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RoleDetailPage({ params }: Props) {
  await requireAuth();
  await checkPermission("admin.roles.read.all");

  const { id } = await params;
  const role = await getRoleById(id);
  if (!role) notFound();

  const canManage = true; // TODO: vérifier permission admin.roles.manage.all côté client

  return (
    <div className="space-y-6">
      {/* Fil d'ariane */}
      <nav className="text-text-secondary flex items-center gap-1.5 text-sm">
        <Link href="/admin/roles" className="hover:text-text-primary transition-colors">
          {"Profils d'accès"}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">{role.name}</span>
      </nav>

      {/* En-tête rôle */}
      <div className="border-cream-darker bg-cream/20 rounded-xl border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-gold-light/40 flex size-12 shrink-0 items-center justify-center rounded-full">
              {role.isSystem ? (
                <Lock className="text-gold-deep size-5" />
              ) : (
                <Shield className="text-gold-deep size-5" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-text-primary font-heading text-xl font-bold">
                  {role.name}
                </h1>
                {role.isSystem && (
                  <Badge className="border-cream-darker text-text-secondary bg-cream text-xs">
                    Système
                  </Badge>
                )}
              </div>
              {role.description && (
                <p className="text-text-secondary mt-1 text-sm">{role.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-4">
                <span className="text-text-secondary flex items-center gap-1.5 text-xs">
                  <Shield className="text-gold-deep size-3.5" />
                  {role.permissionCount} droit{role.permissionCount > 1 ? "s" : ""}
                </span>
                <span className="text-text-secondary flex items-center gap-1.5 text-xs">
                  <Users className="size-3.5" />
                  {role.userCount} membre{role.userCount > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {canManage && (
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-cream-darker text-text-secondary gap-1.5 text-xs"
              >
                <Copy className="size-3.5" />
                Dupliquer
              </Button>
              {!role.isSystem && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-200 text-xs text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" />
                  Supprimer
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Matrice des permissions */}
      <PermissionsMatrix
        roleId={role.id}
        isSystem={role.isSystem}
        grantedCodes={role.permissions.map((p) => p.code)}
      />

      {/* Membres avec ce profil */}
      <div className="border-cream-darker rounded-xl border p-6">
        <h3 className="text-text-primary mb-1 font-semibold">
          Membres avec ce profil ({role.userCount})
        </h3>
        <p className="text-text-secondary mb-4 text-xs">
          Retrouvez tous les membres ayant ce profil dans la liste des membres.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="border-gold-light text-gold-deep hover:bg-gold-light/20 text-xs"
          render={<Link href={`/admin/users?role=${role.slug}`} />}
        >
          Voir les membres
        </Button>
      </div>
    </div>
  );
}
