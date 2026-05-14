"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreHorizontal, Eye, Pencil, PowerOff, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserListItemDTO } from "@/features/admin/types";

interface UsersTableProps {
  users: UserListItemDTO[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatLastLogin(date: Date | null): string {
  if (!date) return "Jamais connecté";
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

export function UsersTable({ users }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="border-cream-darker rounded-xl border">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-cream mb-4 rounded-full p-4">
            <svg
              className="text-gold-deep size-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-text-primary font-medium">Aucun membre trouvé</p>
          <p className="text-text-secondary mt-1 text-sm">
            {"Modifiez vos filtres ou invitez un nouveau membre de l'équipe."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-cream-darker overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow className="bg-cream/50">
            <TableHead className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
              Membre
            </TableHead>
            <TableHead className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
              {"Profil d'accès"}
            </TableHead>
            <TableHead className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
              Dernière connexion
            </TableHead>
            <TableHead className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
              Statut
            </TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-cream/30 transition-colors">
              {/* Membre */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarImage src={user.image ?? undefined} alt={user.name} />
                    <AvatarFallback className="bg-gold-light text-gold-deep text-xs font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-text-primary hover:text-gold-deep truncate text-sm font-medium transition-colors"
                      >
                        {user.name}
                      </Link>
                      {user.isSuperAdmin && (
                        <Badge className="shrink-0 border-amber-200 bg-amber-100 text-[10px] font-semibold text-amber-800">
                          Super Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-text-secondary mt-0.5 truncate text-xs">
                      {user.email}
                    </p>
                    {user.jobTitle && (
                      <p className="text-text-secondary/70 truncate text-xs">
                        {user.jobTitle}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Profils */}
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {user.roles.length > 0 ? (
                    user.roles.slice(0, 2).map((role) => (
                      <Badge
                        key={role.id}
                        className="bg-gold-light/50 text-gold-deep border-gold-light text-xs"
                      >
                        {role.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-text-secondary text-xs italic">
                      Aucun profil
                    </span>
                  )}
                  {user.roles.length > 2 && (
                    <Badge className="text-text-secondary bg-cream border-cream-darker text-xs">
                      +{user.roles.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>

              {/* Dernière connexion */}
              <TableCell>
                <span className="text-text-secondary text-sm">
                  {formatLastLogin(user.lastLoginAt)}
                </span>
              </TableCell>

              {/* Statut */}
              <TableCell>
                {user.isActive ? (
                  <Badge className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                    Actif
                  </Badge>
                ) : (
                  <Badge className="border-amber-200 bg-amber-50 text-xs text-amber-700">
                    Désactivé
                  </Badge>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon" className="size-8" />}
                  >
                    <MoreHorizontal className="size-4" />
                    <span className="sr-only">Actions</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem render={<Link href={`/admin/users/${user.id}`} />}>
                      <Eye className="size-4" />
                      Voir la fiche
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link href={`/admin/users/${user.id}?edit=true`} />}
                    >
                      <Pencil className="size-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-amber-700 focus:text-amber-700"
                      disabled={user.isSuperAdmin}
                    >
                      <PowerOff className="size-4" />
                      {user.isActive ? "Désactiver" : "Réactiver"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      disabled={user.isSuperAdmin}
                    >
                      <Trash2 className="size-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
