"use client";

import { useRef } from "react";
import { useFormContext, type FieldPath } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import type { CreateEmailTemplateInput } from "../../schemas/template.schema";

type ContentField = Extract<
  FieldPath<CreateEmailTemplateInput>,
  "content" | "conclusion"
>;

interface ContentEditorProps {
  label: string;
  name: ContentField;
  placeholder: string;
  onFocus: (
    getValue: () => string,
    setValue: (val: string) => void,
    cursorPos: number
  ) => void;
}

export function ContentEditor({ label, name, placeholder, onFocus }: ContentEditorProps) {
  const form = useFormContext<CreateEmailTemplateInput>();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const trackCursor = (setValue: (val: string) => void) => {
    const el = textareaRef.current;
    if (el) {
      onFocus(() => el.value, setValue, el.selectionStart ?? el.value.length);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-text-primary text-sm font-semibold">{label}</h2>

      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only text-xs">{label}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                ref={(el) => {
                  field.ref(el);
                  textareaRef.current = el;
                }}
                value={field.value ?? ""}
                placeholder={placeholder}
                rows={5}
                className="border-cream-darker focus:border-gold resize-none font-mono text-sm leading-relaxed"
                onFocus={() => trackCursor(field.onChange)}
                onClick={() => trackCursor(field.onChange)}
                onKeyUp={() => trackCursor(field.onChange)}
                onSelect={() => trackCursor(field.onChange)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
