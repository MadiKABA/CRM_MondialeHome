"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteArticle } from "../server/actions";

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
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
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

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
          <AlertDialogDescription>
            Vous êtes sur le point de supprimer <strong>&quot;{articleName}&quot;</strong>
            . Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Suppression…" : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
