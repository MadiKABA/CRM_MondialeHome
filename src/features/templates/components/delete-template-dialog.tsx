"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { deleteTemplate } from "../server/actions";
import type { TemplateDTO } from "../types";

interface DeleteTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateDTO | null;
  onSuccess: () => void;
}

export function DeleteTemplateDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: DeleteTemplateDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!template) return;
    startTransition(async () => {
      const result = await deleteTemplate({ templateId: template.id });
      if (result.success) {
        toast.success(`Template "${template.name}" supprimé`);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    });
  };

  if (!template) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="size-5" />
            Supprimer le template
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>
              Vous êtes sur le point de supprimer{" "}
              <span className="font-semibold text-gray-900">
                &quot;{template.name}&quot;
              </span>
              .
            </span>
            {template.usageCount > 0 && (
              <span className="block rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                ⚠️ Ce template a été utilisé <strong>{template.usageCount} fois</strong>.
                Les campagnes existantes ne seront pas affectées.
              </span>
            )}
            <span className="block">Cette action est irréversible.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="gap-2 bg-red-600 text-white hover:bg-red-700"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Supprimer
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
