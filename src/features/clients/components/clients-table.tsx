"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Trash2, Phone, Mail, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientAvatar } from "./client-avatar";
import { ClientStatusBadge } from "./client-status-badge";
import { DeleteClientDialog } from "./delete-client-dialog";
import type { ClientListItemDTO } from "../types";

interface ClientsTableProps {
  clients: ClientListItemDTO[];
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [toDelete, setToDelete] = useState<ClientListItemDTO | null>(null);

  if (clients.length === 0) {
    return (
      <div className="border-border bg-card flex flex-col items-center justify-center rounded-xl border py-16 text-center">
        <div className="bg-cream mb-4 rounded-full p-4">
          <Star className="text-text-secondary size-8" />
        </div>
        <p className="font-heading text-lg font-semibold">Aucun client trouvé</p>
        <p className="text-text-secondary mt-1 text-sm">
          Modifiez vos filtres ou ajoutez votre premier client.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop — tableau */}
      <div className="border-border hidden overflow-hidden rounded-xl border md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-cream hover:bg-cream border-cream-darker">
              <TableHead className="font-semibold">Client</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Ville</TableHead>
              <TableHead className="font-semibold">Statut</TableHead>
              <TableHead className="text-right font-semibold">Dépensé</TableHead>
              <TableHead className="text-right font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="hover:bg-cream/50 border-border">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <ClientAvatar name={client.fullName} id={client.id} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{client.fullName}</p>
                      {client.reference && (
                        <p className="text-text-secondary font-mono text-xs">
                          {client.reference}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    {client.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="text-text-secondary size-3.5 shrink-0" />
                        <span className="font-mono text-xs">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="text-text-secondary size-3.5 shrink-0" />
                        <span className="max-w-[160px] truncate text-xs">
                          {client.email}
                        </span>
                      </div>
                    )}
                    {!client.phone && !client.email && (
                      <span className="text-text-secondary text-xs">—</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {client.city ?? <span className="text-text-secondary">—</span>}
                    {client.district && (
                      <p className="text-text-secondary text-xs">{client.district}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <ClientStatusBadge status={client.status} isVip={client.isVip} />
                </TableCell>
                <TableCell className="text-right">
                  <p className="text-sm font-medium">
                    {client.totalSpent > 0 ? (
                      client.totalSpent.toLocaleString("fr-FR") + " FCFA"
                    ) : (
                      <span className="text-text-secondary">—</span>
                    )}
                  </p>
                  {client.totalOrders > 0 && (
                    <p className="text-text-secondary text-xs">
                      {client.totalOrders} commande{client.totalOrders > 1 ? "s" : ""}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-text-secondary hover:text-foreground hover:bg-cream h-8 px-2"
                      title="Voir la fiche"
                      render={<Link href={`/clients/${client.id}`} />}
                    >
                      <Eye className="size-4" />
                      <span className="ml-1 hidden xl:inline">Voir</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gold-deep hover:text-gold-darker hover:bg-gold-light/30 h-8 px-2"
                      title="Modifier"
                      render={<Link href={`/clients/${client.id}/edit`} />}
                    >
                      <Pencil className="size-4" />
                      <span className="ml-1 hidden xl:inline">Modifier</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                      title="Supprimer"
                      onClick={() => setToDelete(client)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-3 md:hidden">
        {clients.map((client) => (
          <div
            key={client.id}
            className="border-border bg-card rounded-xl border p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <ClientAvatar name={client.fullName} id={client.id} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{client.fullName}</p>
                  <ClientStatusBadge
                    status={client.status}
                    isVip={client.isVip}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-1 text-sm">
              {client.phone && (
                <div className="text-text-secondary flex items-center gap-2">
                  <Phone className="size-3.5" />
                  <span className="font-mono text-xs">{client.phone}</span>
                </div>
              )}
              {client.city && (
                <p className="text-text-secondary text-xs">
                  {[client.city, client.district].filter(Boolean).join(", ")}
                </p>
              )}
              {client.totalSpent > 0 && (
                <p className="text-gold-deep text-xs font-medium">
                  {client.totalSpent.toLocaleString("fr-FR")} FCFA
                </p>
              )}
            </div>

            <div className="border-cream-darker mt-3 flex gap-2 border-t pt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                render={<Link href={`/clients/${client.id}`} />}
              >
                <Eye className="size-3.5" />
                Voir
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gold-light text-gold-deep hover:bg-gold-light/30 flex-1 text-xs"
                render={<Link href={`/clients/${client.id}/edit`} />}
              >
                <Pencil className="size-3.5" />
                Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10 border-red-200 px-3"
                onClick={() => setToDelete(client)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <DeleteClientDialog
        client={toDelete}
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
      />
    </>
  );
}
