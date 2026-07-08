import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSegmentById } from "@/features/segments/server/queries";
import { SegmentDetailClient } from "@/features/segments/components/segment-detail-client";
import { CRITERIA_DEFINITIONS } from "@/features/segments/types";

export const dynamic = "force-dynamic";

interface SegmentDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata({ params }: SegmentDetailPageProps) {
  const { id } = await params;
  const data = await getSegmentById(id);
  return {
    title: data ? `${data.segment.name} — Mondiale Home CRM` : "Segment introuvable",
  };
}

export default async function SegmentDetailPage({
  params,
  searchParams,
}: SegmentDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));

  const data = await getSegmentById(id, page, 25);
  if (!data) notFound();

  const { segment, members, total } = data;
  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-6">
      {/* Retour */}
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

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-full text-xl"
            style={{ backgroundColor: `${segment.color}22` }}
          >
            {segment.icon ?? (segment.type === "STATIC" ? "👥" : "⚡")}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold">{segment.name}</h1>
              {segment.isSystem && (
                <Badge className="border-cream-darker text-text-secondary bg-cream text-xs">
                  Système
                </Badge>
              )}
              <Badge
                className={
                  segment.type === "STATIC"
                    ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                }
              >
                {segment.type === "STATIC" ? "Groupe manuel" : "Segment automatique"}
              </Badge>
            </div>
            {segment.description && (
              <p className="text-text-secondary mt-1 text-sm">{segment.description}</p>
            )}
            <p className="text-text-secondary mt-1 text-sm">
              {segment.memberCount.toLocaleString("fr-FR")} client
              {segment.memberCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Critères (segment dynamique) */}
      {segment.type === "DYNAMIC" &&
        segment.criteria &&
        segment.criteria.criteria.length > 0 && (
          <div className="border-cream-darker bg-background rounded-xl border p-5">
            <p className="text-text-secondary mb-3 text-xs font-semibold tracking-wider uppercase">
              Critères de sélection
            </p>
            <div className="space-y-1.5">
              {segment.criteria.criteria.map((c, i) => {
                const def = CRITERIA_DEFINITIONS.find((d) => d.field === c.field);
                const op = def?.operators.find((o) => o.value === c.operator);
                return (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && (
                      <span className="text-text-muted text-xs font-medium">
                        {segment.criteria!.operator === "AND" ? "ET" : "OU"}
                      </span>
                    )}
                    <span className="text-text-secondary text-sm">
                      <span className="text-text-primary font-medium">
                        {def?.label ?? c.field}
                      </span>{" "}
                      <span className="text-text-muted">{op?.label ?? c.operator}</span>{" "}
                      <span className="text-text-primary font-medium">
                        {String(c.value)}
                        {def?.unit ? ` ${def.unit}` : ""}
                      </span>
                      {c.value2 != null && (
                        <>
                          {" "}
                          et{" "}
                          <span className="text-text-primary font-medium">
                            {String(c.value2)}
                            {def?.unit ? ` ${def.unit}` : ""}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            {segment.lastRefreshedAt && (
              <p className="text-text-muted mt-3 text-xs">
                Dernière actualisation :{" "}
                {new Date(segment.lastRefreshedAt).toLocaleString("fr-FR")}
              </p>
            )}
          </div>
        )}

      {/* Liste des membres avec actions client */}
      <SegmentDetailClient
        segment={segment}
        members={members}
        total={total}
        totalPages={totalPages}
        currentPage={page}
      />
    </div>
  );
}
