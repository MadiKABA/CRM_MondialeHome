import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroupForm } from "@/features/segments/components/group-form";

export const metadata = { title: "Nouveau groupe — Mondiale Home CRM" };

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-secondary"
          render={<Link href="/segments" />}
        >
          <ChevronLeft className="size-4" />
          Segments
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-2xl font-bold">Nouveau groupe</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Créez un groupe et ajoutez manuellement des clients
        </p>
      </div>

      <div className="border-cream-darker bg-background max-w-lg rounded-xl border p-6">
        <GroupForm />
      </div>
    </div>
  );
}
