"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendInvitationSchema } from "@/features/admin/schemas/invitation.schema";
import { sendInvitation } from "@/features/admin/server/actions/invitations.actions";
import type { SendInvitationInput } from "@/features/admin/schemas/invitation.schema";
import type { RoleListItemDTO } from "@/features/admin/types";

interface InviteDialogProps {
  availableRoles: RoleListItemDTO[];
  children: React.ReactNode;
}

export function InviteDialog({ availableRoles, children }: InviteDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SendInvitationInput>({
    resolver: zodResolver(sendInvitationSchema),
    defaultValues: { email: "", roleId: undefined },
  });

  async function onSubmit(data: SendInvitationInput) {
    const result = await sendInvitation(data);
    if (result.success) {
      toast.success("Invitation envoyée avec succès.");
      reset();
      setOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />}>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <div className="bg-gold-light/40 flex size-9 shrink-0 items-center justify-center rounded-full">
              <Mail className="text-gold-deep size-4.5" />
            </div>
            <DialogTitle>Inviter un membre</DialogTitle>
          </div>
          <DialogDescription>
            Un lien d&apos;activation sera envoyé à l&apos;adresse indiquée (valable 7
            jours).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inv-email">Adresse email *</Label>
            <Input
              id="inv-email"
              type="email"
              {...register("email")}
              placeholder="prenom.nom@example.com"
              autoFocus
            />
            {errors.email && (
              <p className="text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inv-role">{"Profil d'accès (optionnel)"}</Label>
            <select
              id="inv-role"
              {...register("roleId")}
              className="border-cream-darker text-text-primary bg-background focus:ring-gold-deep w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            >
              <option value="">— Aucun profil assigné —</option>
              {availableRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <DialogClose
              render={<button type="button" />}
              className="border-cream-darker text-text-secondary hover:bg-cream/50 rounded-lg border px-4 py-2 text-sm transition-colors"
            >
              Annuler
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gold-deep hover:bg-gold-deep/90 text-cream"
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Envoyer l&apos;invitation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
