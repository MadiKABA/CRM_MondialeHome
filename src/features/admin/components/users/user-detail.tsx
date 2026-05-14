"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Shield,
  CheckCircle2,
  XCircle,
  Globe,
  Clock,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserDetailDTO } from "@/features/admin/types";

interface UserDetailProps {
  user: UserDetailDTO;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserDetail({ user }: UserDetailProps) {
  const memberSince = formatDistanceToNow(user.createdAt, {
    addSuffix: false,
    locale: fr,
  });

  return (
    <div className="border-cream-darker bg-cream/20 rounded-xl border p-6">
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        {/* Avatar */}
        <Avatar className="border-cream-darker size-20 border-2 shadow-sm">
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback className="bg-gold-light text-gold-deep text-xl font-bold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>

        {/* Infos principales */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-text-primary font-heading text-xl font-bold">
              {user.name}
            </h2>
            {user.isSuperAdmin && (
              <Badge className="border-amber-200 bg-amber-100 text-xs font-semibold text-amber-800">
                Super Administrateur
              </Badge>
            )}
            {user.isActive ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                <CheckCircle2 className="mr-1 size-3" />
                Actif
              </Badge>
            ) : (
              <Badge className="border-amber-200 bg-amber-50 text-xs text-amber-700">
                <XCircle className="mr-1 size-3" />
                Désactivé
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* Email */}
            <div className="flex items-center gap-2">
              <Mail className="text-text-secondary size-4 shrink-0" />
              <span className="text-text-primary text-sm">{user.email}</span>
              {user.emailVerified ? (
                <span title="Email vérifié">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                </span>
              ) : (
                <span title="Email non vérifié">
                  <XCircle className="size-3.5 text-amber-500" />
                </span>
              )}
            </div>

            {/* Téléphone */}
            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="text-text-secondary size-4 shrink-0" />
                <span className="text-text-primary text-sm">{user.phone}</span>
              </div>
            )}

            {/* Poste */}
            {user.jobTitle && (
              <div className="flex items-center gap-2">
                <Briefcase className="text-text-secondary size-4 shrink-0" />
                <span className="text-text-primary text-sm">
                  {user.jobTitle}
                  {user.department && (
                    <span className="text-text-secondary"> — {user.department}</span>
                  )}
                </span>
              </div>
            )}

            {/* Langue / Fuseau */}
            <div className="flex items-center gap-2">
              <Globe className="text-text-secondary size-4 shrink-0" />
              <span className="text-text-secondary text-sm">
                {user.language.toUpperCase()} — {user.timezone}
              </span>
            </div>
          </div>

          {/* Meta : membre depuis + dernière connexion */}
          <div className="text-text-secondary flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              Membre depuis {memberSince}
            </span>
            {user.lastLoginAt ? (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                Dernière connexion{" "}
                {formatDistanceToNow(user.lastLoginAt, { addSuffix: true, locale: fr })}
              </span>
            ) : (
              <span className="flex items-center gap-1 italic">
                <Clock className="size-3.5" />
                Jamais connecté
              </span>
            )}
            <span className="flex items-center gap-1">
              <Shield className="size-3.5" />
              {user.loginCount} connexion{user.loginCount > 1 ? "s" : ""} au total
            </span>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex shrink-0 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-cream-darker text-text-secondary"
            render={<Link href={`/admin/users/${user.id}?edit=true`} />}
          >
            Modifier
          </Button>
        </div>
      </div>
    </div>
  );
}
