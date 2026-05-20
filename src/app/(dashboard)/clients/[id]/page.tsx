import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getClientById,
  getClientConsentLogs,
  getSellers,
} from "@/features/clients/server/queries";
import { ClientDetail } from "@/features/clients/components/client-detail";

interface ClientPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ClientPageProps) {
  const { id } = await params;
  const client = await getClientById(id);
  return { title: client ? `${client.fullName} — CRM` : "Client introuvable" };
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  const [client, consentLogs, sellers] = await Promise.all([
    getClientById(id),
    getClientConsentLogs(id),
    getSellers(),
  ]);

  if (!client) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
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

      <ClientDetail client={client} consentLogs={consentLogs} sellers={sellers} />
    </div>
  );
}
