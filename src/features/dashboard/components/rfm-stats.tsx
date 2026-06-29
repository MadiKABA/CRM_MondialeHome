import Link from "next/link";
import { Users2, RefreshCw } from "lucide-react";
import { RFM_PROFILE_CONFIGS } from "@/features/rfm/types";
import type { RFMProfile } from "@/features/rfm/types";
import type { RFMDashboardStats } from "../types";

interface Props {
  stats: RFMDashboardStats;
}

export function RFMStatsCard({ stats }: Props) {
  const profiles = Object.entries(stats.byProfile).sort(([, a], [, b]) => b - a);

  const lastRunLabel = stats.lastRunAt
    ? new Date(stats.lastRunAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Jamais calculé";

  return (
    <div className="border-cream-darker rounded-xl border bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users2 className="text-gold-deep size-4" />
          <h3 className="text-text-primary text-sm font-semibold">
            Profils clients (RFM)
          </h3>
        </div>
        <Link
          href="/segments"
          className="text-gold-deep hover:text-gold-darker text-xs transition-colors"
        >
          Voir les segments →
        </Link>
      </div>

      <div className="mb-4">
        <div className="text-text-muted mb-1 flex justify-between text-xs">
          <span>{stats.scoredCount} clients scorés</span>
          <span>{stats.total} total</span>
        </div>
        <div className="bg-cream-darker h-1.5 overflow-hidden rounded-full">
          <div
            className="bg-gold-deep h-full rounded-full transition-all"
            style={{
              width:
                stats.total > 0
                  ? `${Math.round((stats.scoredCount / stats.total) * 100)}%`
                  : "0%",
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {profiles.length === 0 ? (
          <p className="text-text-muted py-4 text-center text-sm">
            Score RFM non calculé
          </p>
        ) : (
          profiles.map(([profile, count]) => {
            if (!Object.prototype.hasOwnProperty.call(RFM_PROFILE_CONFIGS, profile)) {
              return null;
            }
            const config = RFM_PROFILE_CONFIGS[profile as RFMProfile];

            const pct =
              stats.scoredCount > 0 ? Math.round((count / stats.scoredCount) * 100) : 0;

            return (
              <div key={profile} className="flex items-center gap-3">
                <span className="w-5 text-center text-sm">{config.icon}</span>
                <div className="flex-1">
                  <div className="mb-0.5 flex justify-between text-xs">
                    <span className="text-text-secondary">{config.label}</span>
                    <span className="text-text-primary font-medium">
                      {count} · {pct}%
                    </span>
                  </div>
                  <div className="bg-cream-darker h-1.5 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: "#8B6914",
                        opacity: 0.3 + (pct / 100) * 0.7,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-cream-darker mt-4 flex items-center gap-1.5 border-t pt-3">
        <RefreshCw className="text-text-muted size-3" />
        <span className="text-text-muted text-[10px]">Calculé le {lastRunLabel}</span>
      </div>
    </div>
  );
}
