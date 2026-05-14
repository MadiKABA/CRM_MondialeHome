import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireAuth, checkPermission } from "@/lib/permissions";
import { getAvailableRoles } from "@/features/admin/server/queries/users.queries";
import { UserForm } from "@/features/admin/components/users/user-form";

export const metadata = { title: "Nouvel utilisateur — Administration" };

export default async function NewUserPage() {
  await requireAuth();
  await checkPermission("admin.users.create.all");

  const availableRoles = await getAvailableRoles();

  return (
    <div className="space-y-6">
      {/* Fil d'ariane */}
      <nav className="text-text-secondary flex items-center gap-1.5 text-sm">
        <Link href="/admin/users" className="hover:text-text-primary transition-colors">
          Membres
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">Nouvel utilisateur</span>
      </nav>

      {/* En-tête */}
      <div>
        <h1 className="text-text-primary font-heading text-2xl font-bold">
          Ajouter un membre
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Créez un nouveau compte utilisateur et assignez-lui des profils d&apos;accès.
        </p>
      </div>

      {/* Formulaire */}
      <UserForm mode="create" availableRoles={availableRoles} />
    </div>
  );
}
