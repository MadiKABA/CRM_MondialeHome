import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getServerSession } from "@/lib/permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  const isSuperAdmin =
    (session?.user as { isSuperAdmin?: boolean } | undefined)?.isSuperAdmin ?? false;

  // Pré-calcul des permissions pour la sidebar — évite un appel DB côté client
  let userPermissions: string[] = [];
  if (session && !isSuperAdmin) {
    const { getEffectivePermissions } = await import("@/features/admin/lib/permissions");
    const perms = await getEffectivePermissions(session.user.id);
    userPermissions = [...perms];
  } else if (isSuperAdmin) {
    userPermissions = ["*"];
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar userPermissions={userPermissions} isSuperAdmin={isSuperAdmin} />
        <SidebarInset>
          <AppHeader />
          <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
