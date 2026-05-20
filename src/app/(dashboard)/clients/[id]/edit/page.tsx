import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClientById, getAllTags } from "@/features/clients/server/queries";
import { ClientForm } from "@/features/clients/components/client-form";

interface EditClientPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditClientPageProps) {
  const { id } = await params;
  const client = await getClientById(id);
  return { title: client ? `Modifier ${client.fullName} — CRM` : "Client introuvable" };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const { id } = await params;
  const [client, tags] = await Promise.all([getClientById(id), getAllTags()]);

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-secondary"
          render={<Link href={`/clients/${id}`} />}
        >
          <ChevronLeft className="size-4" />
          Fiche client
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold">Modifier {client.fullName}</h1>
        <p className="text-text-secondary mt-1 text-sm">Référence : {client.reference}</p>
      </div>

      <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
        <ClientForm client={client} tagSuggestions={tags.map((t) => t.tag)} />
      </div>
    </div>
  );
}
