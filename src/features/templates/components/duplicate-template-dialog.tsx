"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { duplicateTemplate } from "../server/actions";
import {
  duplicateTemplateSchema,
  type DuplicateTemplateInput,
} from "../schemas/template.schema";
import type { TemplateDTO } from "../types";

interface DuplicateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateDTO | null;
  onSuccess: (newId: string) => void;
}

export function DuplicateTemplateDialog({
  open,
  onOpenChange,
  template,
  onSuccess,
}: DuplicateTemplateDialogProps) {
  const [, startTransition] = useTransition();

  const form = useForm<DuplicateTemplateInput>({
    resolver: zodResolver(duplicateTemplateSchema),
    defaultValues: {
      templateId: template?.id ?? "",
      newName: template ? `Copie de ${template.name}` : "",
    },
    values: {
      templateId: template?.id ?? "",
      newName: template ? `Copie de ${template.name}` : "",
    },
  });

  const onSubmit = (values: DuplicateTemplateInput) => {
    startTransition(async () => {
      const result = await duplicateTemplate(values);
      if (result.success && result.data) {
        toast.success(`Template dupliqué : "${values.newName}"`);
        onSuccess(result.data.id);
      } else if (!result.success) {
        toast.error(result.error);
      }
    });
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Dupliquer le template</DialogTitle>
          <p className="text-text-secondary text-sm">
            Créez une copie de{" "}
            <span className="text-text-primary font-medium">
              &quot;{template.name}&quot;
            </span>
            .
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du nouveau template</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="border-cream-darker focus:border-gold"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-cream-darker"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-gold-deep hover:bg-gold-darker gap-2 text-white"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Duplication...
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Dupliquer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
