import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentForm } from "@/features/segments/components/segment-form";

export const metadata = { title: "Nouveau segment — Mondial Home CRM" };

export default function NewSegmentPage() {
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
        <h1 className="font-heading text-2xl font-bold">Nouveau segment automatique</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Définissez les critères — le segment se met à jour automatiquement
        </p>
      </div>

      <div className="border-cream-darker bg-background max-w-2xl rounded-xl border p-6">
        <SegmentForm />
      </div>
    </div>
  );
}
