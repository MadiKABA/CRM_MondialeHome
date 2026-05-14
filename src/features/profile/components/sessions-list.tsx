"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Monitor, Smartphone, Tablet, X, LogOut, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/section-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { revokeSession, revokeAllOtherSessions } from "../server/actions";
import type { SessionDTO } from "../types";

interface SessionsListProps {
  sessions: SessionDTO[];
}

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: "Appareil inconnu", browser: "Navigateur inconnu" };

  let device = "Ordinateur";
  if (/mobile/i.test(ua)) device = "Mobile";
  else if (/tablet|ipad/i.test(ua)) device = "Tablette";

  let browser = "Navigateur inconnu";
  if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/edg/i.test(ua)) browser = "Edge";
  else if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/opera|opr/i.test(ua)) browser = "Opera";

  let os = "";
  if (/windows/i.test(ua)) os = "Windows";
  else if (/mac os/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/android/i.test(ua)) os = "Android";
  else if (/ios|iphone|ipad/i.test(ua)) os = "iOS";

  return { device, browser: os ? `${browser} sur ${os}` : browser };
}

function DeviceIcon({ userAgent }: { userAgent: string | null }) {
  if (!userAgent) return <Monitor className="size-5" />;
  if (/mobile/i.test(userAgent)) return <Smartphone className="size-5" />;
  if (/tablet|ipad/i.test(userAgent)) return <Tablet className="size-5" />;
  return <Monitor className="size-5" />;
}

interface SessionItemProps {
  session: SessionDTO;
  onRevoke: (id: string) => void;
  isRevoking: boolean;
}

function SessionItem({ session, onRevoke, isRevoking }: SessionItemProps) {
  const { browser } = parseUserAgent(session.userAgent);

  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex items-center gap-3">
        <div
          className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${session.isCurrent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
        >
          <DeviceIcon userAgent={session.userAgent} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-foreground truncate text-sm font-medium">{browser}</p>
            {session.isCurrent && (
              <Badge className="bg-primary/10 text-primary border-primary/20 shrink-0 border px-1.5 py-0 text-[10px]">
                Session actuelle
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {session.ipAddress && (
              <span className="flex items-center gap-1">
                <Wifi className="size-3" />
                {session.ipAddress}
              </span>
            )}
            <span>
              Connecté le{" "}
              {format(new Date(session.createdAt), "d MMM yyyy", { locale: fr })}
            </span>
          </div>
        </div>
      </div>

      {!session.isCurrent && (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-8 shrink-0"
          onClick={() => onRevoke(session.id)}
          disabled={isRevoking}
          aria-label="Révoquer cette session"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

export function SessionsList({ sessions }: SessionsListProps) {
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const otherSessions = sessions.filter((s) => !s.isCurrent);

  const handleRevoke = (sessionId: string) => {
    startTransition(async () => {
      const result = await revokeSession(sessionId);
      if (result.success) {
        toast.success("Session révoquée");
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleRevokeAll = async () => {
    const result = await revokeAllOtherSessions();
    if (result.success) {
      toast.success("Toutes les autres sessions ont été déconnectées");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <>
      <SectionCard
        title="Sessions actives"
        description={`${sessions.length} session${sessions.length > 1 ? "s" : ""} active${sessions.length > 1 ? "s" : ""} sur votre compte`}
        icon={<Wifi className="size-5" />}
      >
        <div className="divide-border divide-y">
          {sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              onRevoke={handleRevoke}
              isRevoking={isPending}
            />
          ))}
          {sessions.length === 0 && (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Aucune session active trouvée.
            </p>
          )}
        </div>

        {otherSessions.length > 0 && (
          <div className="border-border mt-4 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 w-full"
              onClick={() => setConfirmAllOpen(true)}
              disabled={isPending}
            >
              <LogOut className="size-4" />
              Déconnecter toutes les autres sessions ({otherSessions.length})
            </Button>
          </div>
        )}
      </SectionCard>

      <ConfirmDialog
        open={confirmAllOpen}
        onOpenChange={setConfirmAllOpen}
        title="Déconnecter toutes les autres sessions ?"
        description={`${otherSessions.length} session${otherSessions.length > 1 ? "s" : ""} seront déconnectées. Vous resterez connecté sur cet appareil.`}
        confirmLabel="Déconnecter"
        onConfirm={handleRevokeAll}
      />
    </>
  );
}
