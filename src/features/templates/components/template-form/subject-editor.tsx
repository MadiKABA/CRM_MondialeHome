"use client";

import { useRef } from "react";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { CreateEmailTemplateInput } from "../../schemas/template.schema";

interface SubjectEditorProps {
  onFocus: (
    getValue: () => string,
    setValue: (val: string) => void,
    cursorPos: number
  ) => void;
}

export function SubjectEditor({ onFocus }: SubjectEditorProps) {
  const form = useFormContext<CreateEmailTemplateInput>();
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-3">
      <h2 className="text-text-primary text-sm font-semibold">Objet de l&apos;email</h2>

      <FormField
        control={form.control}
        name="subject"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">Objet *</FormLabel>
            <FormControl>
              <Input
                {...field}
                ref={(el) => {
                  field.ref(el);
                  inputRef.current = el;
                }}
                placeholder="Ex : 🎁 Offre exclusive — -30% sur les canapés ce week-end"
                className="border-cream-darker focus:border-gold text-sm"
                onFocus={() => {
                  const el = inputRef.current;
                  if (el) {
                    onFocus(
                      () => el.value,
                      (val) => field.onChange(val),
                      el.selectionStart ?? el.value.length
                    );
                  }
                }}
                onClick={() => {
                  const el = inputRef.current;
                  if (el) {
                    onFocus(
                      () => el.value,
                      (val) => field.onChange(val),
                      el.selectionStart ?? el.value.length
                    );
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="preheader"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs">
              Préheader{" "}
              <span className="text-text-muted font-normal">
                (texte de prévisualisation)
              </span>
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="Texte visible après l'objet dans la boîte mail"
                className="border-cream-darker focus:border-gold text-sm"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
