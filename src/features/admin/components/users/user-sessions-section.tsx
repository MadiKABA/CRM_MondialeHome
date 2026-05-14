"use client";

import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MonitorSmartphone, Smartphone, Monitor, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionDTO } from "@/features/admin/types";

interface UserSessionsSectionProps {
  sessions: SessionDTO[];
  userId?: string;
}

function detectDevice(userAgent: string | null): { label: string; Icon: typeof Monitor } {
  if (!userAgent) return { label: "Appareil inconnu", Icon: Globe };
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return { label: "Mobile", Icon: Smartphone };
  }
  return { label: "Ordinateur", Icon: Monitor };
}

function detectBrowser(userAgent: string | null): string {
  if (!userAgent) return "";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Navigateur";
}

export function UserSessionsSection({ sessions }: UserSessionsSectionProps) {
  return (
    <div className="border-cream-darker rounded-xl border p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-text-primary flex items-center gap-2 font-semibold">
            <MonitorSmartphone className="text-gold-deep size-4" />
            Connexions actives
          </h3>
          <p className="text-text-secondary mt-0.5 text-xs">
            {sessions.length} session{sessions.length > 1 ? "s" : ""} active
            {sessions.length > 1 ? "s" : ""} en ce moment
          </p>
        </div>
        {sessions.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5 border-amber-200 text-xs text-amber-700 hover:bg-amber-50"
          >
            <LogOut className="size-3.5" />
            Tout déconnecter
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-text-secondary text-sm italic">Aucune session active</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => {
            const { label: deviceLabel, Icon: DeviceIcon } = detectDevice(
              session.userAgent
            );
            const browser = detectBrowser(session.userAgent);

            return (
              <div
                key={session.id}
                className="border-cream-darker bg-cream/20 flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-gold-light/30 flex size-8 shrink-0 items-center justify-center rounded-full">
                    <DeviceIcon className="text-gold-deep size-4" />
                  </div>
                  <div>
                    <p className="text-text-primary text-sm font-medium">
                      {deviceLabel} — {browser}
                    </p>
                    <p className="text-text-secondary text-xs">
                      {session.ipAddress ?? "IP inconnue"} •{" "}
                      {formatDistanceToNow(session.createdAt, {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-xs text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                >
                  Déconnecter
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
