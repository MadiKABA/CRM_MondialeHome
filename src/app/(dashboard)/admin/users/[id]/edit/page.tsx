import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireAuth, checkPermission } from "@/lib/permissions/server";
import { getUserById } from "@/features/admin/server/queries/users.queries";
import { getAvailableRoles } from "@/features/admin/server/queries/users.queries";
import { UserForm } from "@/features/admin/components/users/user-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const user = await getUserById(id);
  return {
    title: user ? `Modifier ${user.name} — Administration` : "Utilisateur introuvable",
  };
}

export default async function EditUserPage({ params }: PageProps) {
  await requireAuth();
  await checkPermission("admin.users.update.all");

  const { id } = await params;

  const [user, availableRoles] = await Promise.all([
    getUserById(id),
    getAvailableRoles(),
  ]);

  if (!user) notFound();

  return (
    <div className="space-y-6">
      {/* Fil d'ariane */}
      <nav className="text-text-secondary flex items-center gap-1.5 text-sm">
        <Link href="/admin/users" className="hover:text-text-primary transition-colors">
          Membres
        </Link>
        <ChevronRight className="size-3.5" />
        <Link
          href={`/admin/users/${user.id}`}
          className="hover:text-text-primary transition-colors"
        >
          {user.name}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-text-primary font-medium">Modifier</span>
      </nav>

      {/* En-tête */}
      <div>
        <h1 className="text-text-primary font-heading text-2xl font-bold">
          Modifier {user.name}
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          Mettez à jour les informations et les profils d&apos;accès de ce membre.
        </p>
      </div>

      {/* Formulaire */}
      <UserForm mode="edit" user={user} availableRoles={availableRoles} />
    </div>
  );
}
