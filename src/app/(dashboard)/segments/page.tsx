import Link from "next/link";
import { Plus, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllSegments } from "@/features/segments/server/queries";
import { SegmentsList } from "@/features/segments/components/segments-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Segments — Mondial Home CRM" };

export default async function SegmentsPage() {
  const data = await getAllSegments();

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Segments</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Organisez vos clients en groupes manuels ou segments automatiques
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="border-cream-darker text-text-secondary hover:bg-cream"
            render={<Link href="/segments/nouveau-groupe" />}
          >
            <Users2 className="size-4" />
            Nouveau groupe
          </Button>
          <Button render={<Link href="/segments/nouveau-segment" />}>
            <Plus className="size-4" />
            Nouveau segment
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-background border-cream-darker rounded-xl border p-4 text-center">
          <p className="font-heading text-2xl font-bold">{data.stats.totalSegments}</p>
          <p className="text-text-secondary mt-1 text-xs">Segments auto</p>
        </div>
        <div className="bg-background border-cream-darker rounded-xl border p-4 text-center">
          <p className="font-heading text-2xl font-bold">{data.stats.totalGroups}</p>
          <p className="text-text-secondary mt-1 text-xs">Groupes manuels</p>
        </div>
        <div className="bg-background border-cream-darker rounded-xl border p-4 text-center">
          <p className="font-heading text-2xl font-bold">
            {data.stats.totalClients.toLocaleString("fr-FR")}
          </p>
          <p className="text-text-secondary mt-1 text-xs">Clients ciblés</p>
        </div>
      </div>

      <SegmentsList data={data} />
    </div>
  );
}
