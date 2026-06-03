import { redirect } from "next/navigation";
import { getServerSession, hasPermission } from "@/lib/permissions/server";
import { SaleForm } from "@/features/sales/components/sale-form/sale-form";

export default async function NouvellePage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const canCreate = await hasPermission("sales.create.all");
  if (!canCreate) redirect("/sales");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Nouvelle vente</h1>
        <p className="text-muted-foreground text-sm">Enregistrer une vente</p>
      </div>
      <SaleForm />
    </div>
  );
}
