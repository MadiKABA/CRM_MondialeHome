"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  DEFAULT_COUNTRY,
  cleanPhoneInput,
  getPhoneCountries,
  getPhoneCountry,
  parsePhone,
  formatPhoneDisplay,
  type CountryCode,
  type PhoneCountry,
} from "@/lib/phone";

interface PhoneInputProps {
  id?: string;
  /** Valeur du formulaire : E.164 (ou saisie partielle), "" si vide */
  value: string | null | undefined;
  /** Émet le E.164 quand le numéro est valide, sinon une saisie internationale partielle */
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  /** Affiche l'état d'erreur et le message « Numéro invalide pour <pays> » */
  invalid?: boolean;
  placeholder?: string;
}

function initialState(value: string | null | undefined): {
  country: CountryCode;
  national: string;
} {
  if (!value) return { country: DEFAULT_COUNTRY, national: "" };
  const parsed = parsePhone(value);
  if (parsed.ok) {
    const country = parsed.country ?? DEFAULT_COUNTRY;
    const international = formatPhoneDisplay(parsed.e164);
    // « +221 77 123 45 67 » → partie nationale « 77 123 45 67 »
    const national = international.replace(/^\+\d+\s?/, "");
    return { country, national };
  }
  return { country: getPhoneCountry(value) ?? DEFAULT_COUNTRY, national: value };
}

export function PhoneInput({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  placeholder = "77 123 45 67",
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [{ country, national }, setState] = useState(() => initialState(value));
  const { priority, others, all } = getPhoneCountries();
  const current: PhoneCountry = all.find((c) => c.code === country) ?? priority[0]!;

  const emit = (nextCountry: CountryCode, text: string) => {
    const cleaned = cleanPhoneInput(text);
    if (!cleaned) {
      setState({ country: nextCountry, national: "" });
      onChange("");
      return;
    }
    // Saisie internationale (+33…) : le pays suit l'indicatif
    if (cleaned.startsWith("+")) {
      const parsed = parsePhone(cleaned);
      setState({
        country: parsed.ok ? (parsed.country ?? nextCountry) : nextCountry,
        national: text,
      });
      onChange(parsed.ok ? parsed.e164 : cleaned);
      return;
    }
    const dial = all.find((c) => c.code === nextCountry)?.dialCode ?? "";
    const parsed = parsePhone(cleaned, nextCountry);
    setState({ country: nextCountry, national: text });
    onChange(parsed.ok ? parsed.e164 : `${dial}${cleaned.replace(/^0+/, "")}`);
  };

  return (
    <div className="mt-1">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                aria-label={`Pays : ${current.name} (${current.dialCode})`}
                className={cn(
                  "h-11 shrink-0 gap-1.5 px-3 text-base",
                  invalid && "border-destructive"
                )}
              />
            }
          >
            <span aria-hidden className="text-lg leading-none">
              {current.flag}
            </span>
            <span className="text-sm">{current.dialCode}</span>
            <ChevronDown className="size-4 opacity-50" />
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder="Rechercher un pays…" className="text-base" />
              <CommandList>
                <CommandEmpty>Aucun pays trouvé</CommandEmpty>
                {[
                  { label: "Afrique de l'Ouest et diaspora", items: priority },
                  { label: "Autres pays", items: others },
                ].map((group) => (
                  <CommandGroup key={group.label} heading={group.label}>
                    {group.items.map((c) => (
                      <CommandItem
                        key={c.code}
                        value={`${c.name} ${c.dialCode} ${c.code}`}
                        data-checked={c.code === country}
                        className="min-h-11"
                        onSelect={() => {
                          setOpen(false);
                          emit(c.code, national.startsWith("+") ? "" : national);
                        }}
                      >
                        <span aria-hidden className="text-lg">
                          {c.flag}
                        </span>
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {c.dialCode}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={placeholder}
          value={national}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(e) => emit(country, e.target.value)}
          onBlur={onBlur}
          className="h-11 text-base"
        />
      </div>
      {invalid && (
        <p className="text-destructive mt-1 text-xs">
          Numéro invalide pour ce pays ({current.name})
        </p>
      )}
    </div>
  );
}
