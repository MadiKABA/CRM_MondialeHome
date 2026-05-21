"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteArticle } from "../server/actions";

const CONFIRMATION_WORD = "SUPPRIMER";

interface DeleteArticleDialogProps {
  articleId: string;
  articleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectAfterDelete?: boolean;
}

export function DeleteArticleDialog({
  articleId,
  articleName,
  open,
  onOpenChange,
  redirectAfterDelete = false,
}: DeleteArticleDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isConfirmed = confirmation === CONFIRMATION_WORD;

  const handleDelete = () => {
    if (!isConfirmed) return;
    startTransition(async () => {
      const result = await deleteArticle(articleId);
      if (result.success) {
        toast.success(`"${articleName}" supprimé`);
        onOpenChange(false);
        if (redirectAfterDelete) {
          router.push("/catalogue/articles");
        }
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleClose = (nextOpen: boolean) => {
    if (isPending) return;
    if (!nextOpen) setConfirmation("");
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <div className="bg-destructive/10 flex size-10 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive size-5" />
            </div>
            <DialogTitle>Supprimer cet article ?</DialogTitle>
          </div>
          <DialogDescription className="leading-relaxed">
            Vous êtes sur le point de supprimer{" "}
            <strong className="text-foreground">&quot;{articleName}&quot;</strong>.
            <br />
            Cette action est <strong>irréversible</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="delete-confirm" className="text-muted-foreground text-sm">
            Tapez{" "}
            <code className="bg-destructive/10 text-destructive rounded px-1.5 py-0.5 font-mono text-xs">
              {CONFIRMATION_WORD}
            </code>{" "}
            pour confirmer
          </Label>
          <Input
            id="delete-confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
            placeholder={CONFIRMATION_WORD}
            className="font-mono tracking-widest"
            autoComplete="off"
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Suppression…
              </>
            ) : (
              "Supprimer définitivement"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
