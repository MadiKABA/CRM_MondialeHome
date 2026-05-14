"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AvatarUpload } from "./avatar-upload";
import type { ProfileDTO } from "../types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, Mail, MapPin } from "lucide-react";

interface ProfileHeaderProps {
  profile: ProfileDTO;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  return (
    <div className="bg-card border-border rounded-xl border p-6 md:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar className="ring-primary/20 size-24 ring-4 md:size-28">
            <AvatarImage src={profile.image ?? undefined} alt={profile.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-heading text-2xl font-bold">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <AvatarUpload currentImage={profile.image} userName={profile.name} />
        </div>

        {/* Infos */}
        <div className="flex flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
          <div>
            <h1 className="font-heading text-foreground text-2xl font-bold md:text-3xl">
              {profile.name}
            </h1>
            {profile.jobTitle && (
              <p className="text-muted-foreground mt-0.5 text-sm font-medium">
                {profile.jobTitle}
                {profile.department ? ` · ${profile.department}` : ""}
              </p>
            )}
          </div>

          {/* Badges rôles */}
          {profile.roles.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
              {profile.roles.map((role) => (
                <Badge key={role.id} variant="secondary" className="text-xs">
                  {role.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Métadonnées */}
          <div className="text-muted-foreground flex flex-wrap justify-center gap-4 text-xs sm:justify-start">
            <span className="flex items-center gap-1">
              <Mail className="size-3.5" />
              {profile.email}
              {profile.emailVerified && (
                <Badge
                  variant="outline"
                  className="border-gold-deep/40 text-gold-deep ml-1 px-1.5 py-0 text-[10px]"
                >
                  Vérifié
                </Badge>
              )}
            </span>
            {profile.lastLoginAt && (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                Dernière connexion :{" "}
                {format(new Date(profile.lastLoginAt), "d MMM yyyy 'à' HH:mm", {
                  locale: fr,
                })}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {profile.timezone}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
