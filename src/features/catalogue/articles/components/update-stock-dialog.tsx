"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateArticleStock } from "../server/actions";

const schema = z.object({
  newStock: z.coerce.number().int().min(0, "Le stock ne peut pas être négatif"),
  reason: z.string().min(1, "Le motif est requis"),
});

type FormValues = z.infer<typeof schema>;

interface UpdateStockDialogProps {
  articleId: string;
  articleName: string;
  currentStock: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateStockDialog({
  articleId,
  articleName,
  currentStock,
  open,
  onOpenChange,
}: UpdateStockDialogProps) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { newStock: currentStock, reason: "" },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await updateArticleStock({
        articleId,
        newStock: values.newStock,
        reason: values.reason,
      });
      if (result.success) {
        toast.success("Stock mis à jour");
        reset();
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mettre à jour le stock</DialogTitle>
          <p className="text-muted-foreground text-sm">{articleName}</p>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newStock">
              Nouveau stock <span className="text-destructive">*</span>
            </Label>
            <Input
              id="newStock"
              type="number"
              min={0}
              {...register("newStock")}
              className={errors.newStock ? "border-destructive" : ""}
            />
            {errors.newStock && (
              <p className="text-destructive text-xs">{errors.newStock.message}</p>
            )}
            <p className="text-muted-foreground text-xs">
              Stock actuel : <strong>{currentStock}</strong> unité(s)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">
              Motif <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reason"
              placeholder="Ex : Inventaire mensuel, réception livraison…"
              {...register("reason")}
              className={errors.reason ? "border-destructive" : ""}
            />
            {errors.reason && (
              <p className="text-destructive text-xs">{errors.reason.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
