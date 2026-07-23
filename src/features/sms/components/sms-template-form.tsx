"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeMessage } from "@/lib/sms/character-counter";
import {
  createSmsTemplate,
  updateSmsTemplate,
} from "@/features/templates/server/actions";
import {
  createSmsTemplateSchema,
  type CreateSmsTemplateInput,
} from "../schemas/sms.schema";
import { SmsCharacterMeter } from "./sms-character-meter";
import { SmsPreviewBubble } from "./sms-preview-bubble";
import { SmsVariablesPanel } from "./sms-variables-panel";
import type { TemplateDTO } from "@/features/templates/types";

interface SmsTemplateFormProps {
  mode: "create" | "edit";
  template?: TemplateDTO;
}

export function SmsTemplateForm({ mode, template }: SmsTemplateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const form = useForm<CreateSmsTemplateInput>({
    resolver: zodResolver(createSmsTemplateSchema),
    defaultValues: {
      name: template?.name ?? "",
      content: template?.content ?? "",
    },
  });

  const {
    register,
    formState: { errors, isSubmitting },
  } = form;
  const content = form.watch("content");
  const [analysis, setAnalysis] = useState(() => analyzeMessage(content ?? ""));
  const { ref: contentRef, ...contentField } = register("content");

  const handleContentChange = (value: string) => {
    form.setValue("content", value, { shouldValidate: true });
    setAnalysis(analyzeMessage(value));
  };

  const handleInsertVariable = (variable: string) => {
    const el = textareaRef.current;
    const current = form.getValues("content") ?? "";
    const cursorPos = el?.selectionStart ?? current.length;
    const next = current.slice(0, cursorPos) + variable + current.slice(cursorPos);
    handleContentChange(next);
  };

  const onSubmit = (values: CreateSmsTemplateInput) => {
    startTransition(async () => {
      const result =
        mode === "create"
          ? await createSmsTemplate(values)
          : await updateSmsTemplate(template!.id, values);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create"
          ? `Template SMS "${values.name}" créé avec succès`
          : `Template SMS "${values.name}" modifié`
      );
      router.push("/templates?channel=sms");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/templates?channel=sms">
            <Button
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Templates
            </Button>
          </Link>
          <h1 className="text-text-primary font-serif text-xl font-bold">
            {mode === "create" ? "Nouveau template SMS" : `Modifier "${template?.name}"`}
          </h1>
        </div>

        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting || isPending}
          className="bg-gold-deep hover:bg-gold-darker gap-2 text-white"
        >
          {isSubmitting || isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="size-4" />
              {mode === "create" ? "Créer" : "Enregistrer"}
            </>
          )}
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-5">
          {/* Colonne formulaire */}
          <div className="space-y-4 lg:col-span-2">
            <div className="border-cream-darker space-y-4 rounded-xl border bg-white p-4">
              <h2 className="text-text-primary text-sm font-semibold">
                Informations générales
              </h2>

              <div className="space-y-1.5">
                <label className="text-text-primary text-xs font-medium">
                  Nom du template *
                </label>
                <input
                  {...register("name")}
                  placeholder="Ex : Promo Soldes Canapés Janvier"
                  className="border-cream-darker focus:border-gold w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none"
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="border-cream-darker space-y-3 rounded-xl border bg-white p-4">
              <h2 className="text-text-primary text-sm font-semibold">Message</h2>

              <Textarea
                {...contentField}
                ref={(el) => {
                  contentRef(el);
                  textareaRef.current = el;
                }}
                value={content ?? ""}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={
                  "Bonjour {{prenom}}, profitez de -{{reduction}}% sur {{produit}} !"
                }
                rows={5}
                className="border-cream-darker focus:border-gold resize-none text-sm leading-relaxed"
              />
              {errors.content && (
                <p className="text-xs text-red-500">{errors.content.message}</p>
              )}

              <SmsCharacterMeter analysis={analysis} />
            </div>
          </div>

          {/* Colonne preview */}
          <div className="lg:sticky lg:top-4 lg:col-span-2">
            <div
              className="border-cream-darker overflow-hidden rounded-xl border bg-white"
              style={{ height: "calc(100vh - 220px)" }}
            >
              <SmsPreviewBubble message={content ?? ""} />
            </div>
          </div>

          {/* Colonne variables */}
          <div className="lg:sticky lg:top-4 lg:col-span-1">
            <div
              className="border-cream-darker overflow-auto rounded-xl border bg-white p-3"
              style={{ maxHeight: "calc(100vh - 220px)" }}
            >
              <SmsVariablesPanel usedIn={content ?? ""} onInsert={handleInsertVariable} />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
