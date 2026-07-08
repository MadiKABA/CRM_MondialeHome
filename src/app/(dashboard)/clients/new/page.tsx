import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllTags } from "@/features/clients/server/queries";
import { ClientForm } from "@/features/clients/components/client-form";

export const metadata = { title: "Nouveau client — Mondiale Home CRM" };

export default async function NewClientPage() {
  const tags = await getAllTags();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-secondary"
          render={<Link href="/clients" />}
        >
          <ChevronLeft className="size-4" />
          Clients
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold">Nouveau client</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Renseignez les informations du client
        </p>
      </div>

      <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
        <ClientForm tagSuggestions={tags.map((t) => t.tag)} />
      </div>
    </div>
  );
}
