"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ClientSelector } from "./client-selector";
import { QuickClientDialog } from "./quick-client-dialog";
import { ItemsEditor } from "./items-editor";
import { PaymentSection } from "./payment-section";
import { SaleSummary } from "./sale-summary";
import { createSale } from "../../server/actions";
import {
  createSaleSchema,
  type CreateSaleInput,
  type SaleFormValues,
} from "../../schemas/sale.schema";

interface ClientOption {
  id: string;
  fullName: string;
  phone: string | null;
  reference: string | null;
}

export function SaleForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [quickClientOpen, setQuickClientOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const methods = useForm<SaleFormValues>({
    resolver: zodResolver(createSaleSchema),
    defaultValues: {
      clientId: null,
      campaignId: null,
      soldAt: new Date(),
      items: [],
      discountPercent: null,
      discountAmount: null,
      payments: [],
      notes: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = methods;

  function handleClientChange(client: ClientOption | null) {
    setSelectedClient(client);
    setValue("clientId", client?.id && client.id !== "" ? client.id : null);
  }

  function onSubmit(data: SaleFormValues) {
    startTransition(async () => {
      const res = await createSale(createSaleSchema.parse(data) as CreateSaleInput);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(`Vente ${res.data?.reference} enregistrée`);
      router.push(`/sales/${res.data?.id}`);
    });
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          {/* Colonne principale */}
          <div className="space-y-8">
            {/* Section client */}
            <section className="space-y-3">
              <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Client
              </h2>
              <ClientSelector
                value={selectedClient}
                onChange={handleClientChange}
                onQuickCreate={() => setQuickClientOpen(true)}
                disabled={isPending}
              />
            </section>

            <Separator />

            {/* Section articles */}
            <section className="space-y-3">
              <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Articles
              </h2>
              <ItemsEditor />
              {errors.items && (
                <p className="text-destructive text-sm">
                  {typeof errors.items === "object" && "message" in errors.items
                    ? (errors.items as { message: string }).message
                    : "Ajoutez au moins un article"}
                </p>
              )}
            </section>

            <Separator />

            {/* Remise globale */}
            <section className="space-y-3">
              <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Remise globale (optionnel)
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="discountPercent">Remise en %</Label>
                  <Input
                    id="discountPercent"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0"
                    {...register("discountPercent", { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discountAmount">Remise en FCFA</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    min={0}
                    placeholder="0"
                    {...register("discountAmount", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </section>

            <Separator />

            {/* Section paiement */}
            <section className="space-y-3">
              <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                Paiement
              </h2>
              <PaymentSection />
            </section>

            <Separator />

            {/* Date + Notes */}
            <section className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label htmlFor="soldAt" className="flex items-center gap-2">
                  <Calendar className="size-3.5" />
                  Date de vente
                </Label>
                <Input
                  id="soldAt"
                  type="date"
                  defaultValue={today}
                  {...register("soldAt")}
                />
              </div>

              <div className="col-span-full space-y-1.5 lg:col-span-1">
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  placeholder="Observations, conditions particulières..."
                  rows={3}
                  {...register("notes")}
                />
              </div>
            </section>
          </div>

          {/* Colonne récapitulatif — sticky sur desktop */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
            <h2 className="font-heading text-muted-foreground text-sm font-semibold tracking-wide uppercase">
              Récapitulatif
            </h2>
            <SaleSummary />

            <div className="flex flex-col gap-3">
              <Button type="submit" disabled={isPending} size="lg" className="w-full">
                {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Enregistrer la vente
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      </form>

      <QuickClientDialog
        open={quickClientOpen}
        onOpenChange={setQuickClientOpen}
        onCreated={(client) => {
          handleClientChange({
            id: client.id,
            fullName: client.fullName,
            phone: client.phone,
            reference: null,
          });
        }}
      />
    </FormProvider>
  );
}
