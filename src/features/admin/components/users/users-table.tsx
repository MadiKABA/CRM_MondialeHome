"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Eye, Pencil, UserX, UserCheck, Trash2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleStatusDialog } from "@/features/admin/components/users/toggle-status-dialog";
import { DeleteUserDialog } from "@/features/admin/components/users/delete-user-dialog";
import type { UserListItemDTO } from "@/features/admin/types";

interface UsersTableProps {
  users: UserListItemDTO[];
  currentUserId?: string;
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

// ── Card mobile ───────────────────────────────────────────────

function UserCard({
  user,
  currentUserId,
  onToggleStatus,
  onDelete,
}: {
  user: UserListItemDTO;
  currentUserId?: string;
  onToggleStatus: (user: UserListItemDTO, targetActive: boolean) => void;
  onDelete: (user: UserListItemDTO) => void;
}) {
  const isSelf = user.id === currentUserId;
  const canDelete = !user.isSuperAdmin && !isSelf;

  return (
    <div className="border-cream-darker bg-card space-y-3 rounded-xl border p-4">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={user.image ?? undefined} alt={user.name} />
          <AvatarFallback className="bg-gold-light text-gold-deep text-xs font-semibold">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/users/${user.id}`}
              className="text-text-primary hover:text-gold-deep text-sm font-medium transition-colors"
            >
              {user.name}
            </Link>
            {user.isSuperAdmin && (
              <Badge className="shrink-0 border-amber-200 bg-amber-100 text-[10px] font-semibold text-amber-800">
                Super Admin
              </Badge>
            )}
            {user.isActive ? (
              <Badge className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                Actif
              </Badge>
            ) : (
              <Badge className="border-amber-200 bg-amber-50 text-xs text-amber-700">
                Désactivé
              </Badge>
            )}
          </div>
          <p className="text-text-secondary mt-0.5 truncate text-xs">{user.email}</p>
          {user.jobTitle && (
            <p className="text-text-secondary/70 truncate text-xs">{user.jobTitle}</p>
          )}
        </div>
      </div>

      {/* Rôles */}
      {user.roles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {user.roles.slice(0, 2).map((role) => (
            <Badge
              key={role.id}
              className="bg-gold-light/50 text-gold-deep border-gold-light text-xs"
            >
              {role.name}
            </Badge>
          ))}
          {user.roles.length > 2 && (
            <Badge className="text-text-secondary bg-cream border-cream-darker text-xs">
              +{user.roles.length - 2}
            </Badge>
          )}
        </div>
      )}

      {/* Dernière connexion */}
      <p className="text-text-secondary text-xs">{formatLastLogin(user.lastLoginAt)}</p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="border-cream-darker text-text-secondary hover:text-text-primary hover:bg-cream flex-1"
          title="Voir la fiche"
          aria-label={`Voir la fiche de ${user.name}`}
          render={<Link href={`/admin/users/${user.id}`} />}
        >
          <Eye className="mr-1.5 size-4" />
          Voir
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-cream-darker text-gold-deep hover:text-gold-darker hover:bg-gold-light/30 flex-1"
          title="Modifier"
          aria-label={`Modifier ${user.name}`}
          render={<Link href={`/admin/users/${user.id}?edit=true`} />}
        >
          <Pencil className="mr-1.5 size-4" />
          Modifier
        </Button>
        {!isSelf &&
          (user.isActive ? (
            <Button
              variant="outline"
              size="sm"
              className="border-cream-darker flex-1 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
              onClick={() => onToggleStatus(user, false)}
              title="Désactiver"
              aria-label={`Désactiver ${user.name}`}
              disabled={user.isSuperAdmin}
            >
              <UserX className="mr-1.5 size-4" />
              Désactiver
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-cream-darker text-gold hover:text-gold-darker hover:bg-gold-light/30 flex-1"
              onClick={() => onToggleStatus(user, true)}
              title="Activer"
              aria-label={`Activer ${user.name}`}
            >
              <UserCheck className="mr-1.5 size-4" />
              Activer
            </Button>
          ))}
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            className="border-cream-darker flex-1 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => onDelete(user)}
            title="Supprimer"
            aria-label={`Supprimer ${user.name}`}
          >
            <Trash2 className="mr-1.5 size-4" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [toggleTarget, setToggleTarget] = useState<{
    user: UserListItemDTO;
    targetActive: boolean;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserListItemDTO | null>(null);

  function handleToggleStatus(user: UserListItemDTO, targetActive: boolean) {
    setToggleTarget({ user, targetActive });
  }

  function handleDelete(user: UserListItemDTO) {
    setDeleteTarget(user);
  }

  if (users.length === 0) {
    return (
      <div className="border-cream-darker rounded-xl border">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-cream mb-4 rounded-full p-4">
            <Users className="text-gold-deep size-8" />
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
    <>
      {/* Mobile : cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            currentUserId={currentUserId}
            onToggleStatus={handleToggleStatus}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Desktop : tableau */}
      <div className="border-cream-darker hidden overflow-hidden rounded-xl border sm:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-cream/50">
              <TableHead className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
                Membre
              </TableHead>
              <TableHead className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
                {"Profil d'accès"}
              </TableHead>
              <TableHead className="text-text-secondary hidden text-xs font-semibold tracking-wide uppercase md:table-cell">
                Dernière connexion
              </TableHead>
              <TableHead className="text-text-secondary text-xs font-semibold tracking-wide uppercase">
                Statut
              </TableHead>
              <TableHead className="text-text-secondary text-right text-xs font-semibold tracking-wide uppercase">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const canDelete = !user.isSuperAdmin && !isSelf;

              return (
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
                  <TableCell className="hidden md:table-cell">
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

                  {/* Actions directement visibles */}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {/* Voir */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-text-secondary hover:text-text-primary hover:bg-cream"
                        title="Voir la fiche"
                        aria-label={`Voir la fiche de ${user.name}`}
                        render={<Link href={`/admin/users/${user.id}`} />}
                      >
                        <Eye className="size-4" />
                        <span className="ml-1.5 hidden lg:inline">Voir</span>
                      </Button>

                      {/* Modifier */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gold-deep hover:text-gold-darker hover:bg-gold-light/30"
                        title="Modifier"
                        aria-label={`Modifier ${user.name}`}
                        render={<Link href={`/admin/users/${user.id}?edit=true`} />}
                      >
                        <Pencil className="size-4" />
                        <span className="ml-1.5 hidden lg:inline">Modifier</span>
                      </Button>

                      {/* Activer / Désactiver */}
                      {!isSelf &&
                        (user.isActive ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                            onClick={() => handleToggleStatus(user, false)}
                            title="Désactiver"
                            aria-label={`Désactiver ${user.name}`}
                            disabled={user.isSuperAdmin}
                          >
                            <UserX className="size-4" />
                            <span className="ml-1.5 hidden lg:inline">Désactiver</span>
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gold hover:text-gold-darker hover:bg-gold-light/30"
                            onClick={() => handleToggleStatus(user, true)}
                            title="Activer"
                            aria-label={`Activer ${user.name}`}
                          >
                            <UserCheck className="size-4" />
                            <span className="ml-1.5 hidden lg:inline">Activer</span>
                          </Button>
                        ))}

                      {/* Supprimer */}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDelete(user)}
                          title="Supprimer"
                          aria-label={`Supprimer ${user.name}`}
                        >
                          <Trash2 className="size-4" />
                          <span className="ml-1.5 hidden lg:inline">Supprimer</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      {toggleTarget && (
        <ToggleStatusDialog
          user={toggleTarget.user}
          targetActive={toggleTarget.targetActive}
          open={true}
          onOpenChange={(open) => {
            if (!open) setToggleTarget(null);
          }}
        />
      )}
      {deleteTarget && (
        <DeleteUserDialog
          user={deleteTarget}
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        />
      )}
    </>
  );
}
