"use client";

import { Users2, Zap } from "lucide-react";
import { SegmentCard } from "./segment-card";
import { usePermission } from "@/hooks/use-permission";
import { PERMISSIONS } from "@/lib/permissions/constants";
import type { SegmentListDTO } from "../types";

interface SegmentsListProps {
  data: SegmentListDTO;
}

function EmptySection({ label }: { label: string }) {
  return (
    <div className="border-cream-darker rounded-xl border border-dashed py-10 text-center">
      <p className="text-text-secondary text-sm">{label}</p>
    </div>
  );
}

export function SegmentsList({ data }: SegmentsListProps) {
  const canUpdate = usePermission(PERMISSIONS.SEGMENTS_UPDATE_ALL);
  const canDelete = usePermission(PERMISSIONS.SEGMENTS_DELETE_ALL);
  const canManageMembers = usePermission(PERMISSIONS.SEGMENTS_MANAGE_MEMBERS_ALL);

  return (
    <div className="space-y-8">
      {/* Groupes manuels */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Users2 className="text-gold-deep size-4.5" />
          <h2 className="font-heading text-base font-semibold">Groupes manuels</h2>
          <span className="text-text-secondary text-sm">({data.groups.length})</span>
        </div>

        {data.groups.length === 0 ? (
          <EmptySection label="Aucun groupe — créez votre premier groupe manuel" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.groups.map((group) => (
              <SegmentCard
                key={group.id}
                segment={group}
                canManageMembers={canManageMembers}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Segments automatiques */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Zap className="text-gold-deep size-4.5" />
          <h2 className="font-heading text-base font-semibold">Segments automatiques</h2>
          <span className="text-text-secondary text-sm">({data.segments.length})</span>
        </div>

        {data.segments.length === 0 ? (
          <EmptySection label="Aucun segment — créez votre premier segment automatique" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.segments.map((segment) => (
              <SegmentCard
                key={segment.id}
                segment={segment}
                canManageMembers={canManageMembers}
                canUpdate={canUpdate}
                canDelete={canDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
