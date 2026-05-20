"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deleteCategory } from "../server/actions";
import type { CategoryDTO } from "../types";

interface DeleteCategoryDialogProps {
  category: CategoryDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
}: DeleteCategoryDialogProps) {
  const [isPending, startTransition] = useTransition();

  const hasArticles = category.articleCount > 0;
  const hasChildren = category.childrenCount > 0;
  const isBlocked = hasArticles || hasChildren;

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.success) {
        toast.success(`Catégorie "${category.name}" supprimée.`);
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !isPending && onOpenChange(val)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="size-4 text-red-600" />
            </div>
            <DialogTitle>Supprimer la catégorie</DialogTitle>
          </div>
          <DialogDescription>
            Vous allez supprimer{" "}
            <span className="text-foreground font-medium">
              &quot;{category.name}&quot;
            </span>
            . Cette action est irréversible.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {hasArticles && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">
                  <span className="font-medium">{category.articleCount} article(s)</span>{" "}
                  utilisent cette catégorie. Réassignez-les à une autre catégorie avant de
                  continuer.
                </p>
              </div>
            </div>
          )}

          {hasChildren && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex gap-2">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-800">
                  <span className="font-medium">
                    {category.childrenCount} sous-catégorie(s)
                  </span>{" "}
                  dépendent de cette catégorie. Supprimez-les d&apos;abord.
                </p>
              </div>
            </div>
          )}

          {!isBlocked && (
            <p className="text-muted-foreground text-sm">
              La catégorie sera définitivement supprimée.
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <DialogClose
              render={<button type="button" />}
              disabled={isPending}
              className="border-cream-darker text-text-secondary hover:bg-cream/50 rounded-lg border px-4 py-2 text-sm transition-colors disabled:opacity-50"
            >
              Annuler
            </DialogClose>
            <Button
              onClick={handleDelete}
              disabled={isBlocked || isPending}
              className="gap-1.5 bg-red-600 text-white hover:bg-red-700"
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Supprimer définitivement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
