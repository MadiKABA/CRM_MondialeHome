"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Shield, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SectionCard } from "@/components/shared/section-card";
import type { ProfileDTO } from "../types";

interface SecurityInfoProps {
  profile: ProfileDTO;
}

interface SecurityRowProps {
  label: string;
  status: "ok" | "warning" | "info";
  value: string;
  action?: React.ReactNode;
}

function SecurityRow({ label, status, value, action }: SecurityRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {status === "ok" && <CheckCircle2 className="text-gold-deep size-4.5" />}
          {status === "warning" && <XCircle className="size-4.5 text-yellow-500" />}
          {status === "info" && <Clock className="text-muted-foreground size-4.5" />}
        </div>
        <div>
          <p className="text-foreground text-sm font-medium">{label}</p>
          <p className="text-muted-foreground text-xs">{value}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

export function SecurityInfo({ profile }: SecurityInfoProps) {
  return (
    <SectionCard
      title="Sécurité du compte"
      description="État de sécurité de votre compte"
      icon={<Shield className="size-5" />}
    >
      <div className="divide-border divide-y">
        <SecurityRow
          label="Adresse e-mail"
          status={profile.emailVerified ? "ok" : "warning"}
          value={profile.emailVerified ? "E-mail vérifié" : "E-mail non vérifié"}
          action={
            profile.emailVerified ? (
              <Badge
                variant="outline"
                className="border-gold-deep/40 text-gold-deep shrink-0"
              >
                Vérifié
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="shrink-0 border-yellow-500/40 text-yellow-600"
              >
                À vérifier
              </Badge>
            )
          }
        />

        <SecurityRow
          label="Authentification à deux facteurs"
          status={profile.twoFactorEnabled ? "ok" : "warning"}
          value={
            profile.twoFactorEnabled
              ? "Activée — votre compte est mieux protégé"
              : "Désactivée — recommandé pour sécuriser votre compte"
          }
          action={
            <Badge
              variant="outline"
              className={
                profile.twoFactorEnabled
                  ? "border-gold-deep/40 text-gold-deep shrink-0"
                  : "shrink-0 border-yellow-500/40 text-yellow-600"
              }
            >
              {profile.twoFactorEnabled ? "Activée" : "Désactivée"}
            </Badge>
          }
        />

        <SecurityRow
          label="Dernière connexion"
          status="info"
          value={
            profile.lastLoginAt
              ? format(new Date(profile.lastLoginAt), "EEEE d MMMM yyyy 'à' HH:mm", {
                  locale: fr,
                })
              : "Aucune connexion enregistrée"
          }
        />

        <SecurityRow
          label="Compte créé le"
          status="info"
          value={format(new Date(profile.createdAt), "d MMMM yyyy", { locale: fr })}
        />
      </div>
    </SectionCard>
  );
}
