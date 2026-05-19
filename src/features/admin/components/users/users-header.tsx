"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateUserDialog } from "@/features/admin/components/users/create-user-dialog";

interface UsersHeaderActionsProps {
  roles: Array<{ id: string; name: string }>;
  pendingInvitations: number;
}

export function UsersHeaderActions({
  roles,
  pendingInvitations,
}: UsersHeaderActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-cream-darker text-text-secondary gap-2"
          render={<Link href="/admin/users/invitations" />}
        >
          <Mail className="size-4" />
          Invitations
          {pendingInvitations > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
              {pendingInvitations}
            </span>
          )}
        </Button>
        <Button
          size="sm"
          className="bg-gold-deep hover:bg-gold-deep/90 text-cream gap-2"
          onClick={() => setOpen(true)}
        >
          <Plus className="size-4" />
          Nouveau membre
        </Button>
      </div>

      <CreateUserDialog open={open} onOpenChange={setOpen} roles={roles} />
    </>
  );
}
