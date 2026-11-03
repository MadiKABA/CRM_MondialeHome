import { z } from "zod";
import { getCountryName, getPhoneCountry, parsePhone, DEFAULT_COUNTRY } from "./index";

/**
 * Champ téléphone optionnel : vide → "", sinon normalisé en E.164.
 * Sans indicatif, le Sénégal est supposé. Même règle côté client et serveur.
 */
export const phoneFieldSchema = z
  .string()
  .nullish()
  .transform((value, ctx): string => {
    if (!value || !value.trim()) return "";
    const result = parsePhone(value);
    if (result.ok) return result.e164;

    const country = value.trim().startsWith("+")
      ? getPhoneCountry(value)
      : DEFAULT_COUNTRY;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: country
        ? `Numéro invalide pour ce pays (${getCountryName(country)})`
        : "Numéro de téléphone invalide",
    });
    return z.NEVER;
  });
