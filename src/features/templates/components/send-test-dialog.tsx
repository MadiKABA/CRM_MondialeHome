"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
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
import { sendTestEmail } from "../server/actions";
import { sendTestEmailSchema, type SendTestEmailInput } from "../schemas/template.schema";

interface SendTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  templateName: string;
}

export function SendTestDialog({
  open,
  onOpenChange,
  templateId,
  templateName,
}: SendTestDialogProps) {
  const [, startTransition] = useTransition();
  const [sent, setSent] = useState(false);

  const form = useForm<SendTestEmailInput>({
    resolver: zodResolver(sendTestEmailSchema),
    defaultValues: {
      templateId,
      toEmail: "",
    },
  });

  const onSubmit = (values: SendTestEmailInput) => {
    startTransition(async () => {
      const result = await sendTestEmail(values);
      if (result.success) {
        toast.success(`Email test envoyé à ${values.toEmail}`);
        setSent(true);
        setTimeout(() => {
          onOpenChange(false);
          setSent(false);
          form.reset({ templateId, toEmail: "" });
        }, 1500);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Envoyer un email test</DialogTitle>
          <p className="text-text-secondary text-sm">
            Prévisualisez{" "}
            <span className="text-text-primary font-medium">
              &quot;{templateName}&quot;
            </span>{" "}
            avec des données fictives.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse email de test</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="votre@email.com"
                      className="border-cream-darker focus:border-gold"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-cream/50 border-cream-darker rounded-lg border p-2.5">
              <p className="text-text-muted text-xs">
                Les variables seront remplacées par des données de démonstration (Mamadou
                Diop, Dakar, etc.)
              </p>
            </div>

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
                disabled={form.formState.isSubmitting || sent}
                className="bg-gold-deep hover:bg-gold-darker gap-2 text-white"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Envoi...
                  </>
                ) : sent ? (
                  "Envoyé ✓"
                ) : (
                  <>
                    <Send className="size-4" />
                    Envoyer
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
