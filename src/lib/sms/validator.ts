// Validation SMS : délègue au module téléphone partagé (tous pays, E.164).
import { maskPhone, parsePhone } from "@/lib/phone";

/** Vrai si le numéro est un numéro international valide (format E.164, plausible pour son pays). */
export function isValidSmsNumber(phone: string): boolean {
  return parsePhone(phone).ok;
}

/** Normalise en E.164 ; retourne la saisie nettoyée si le numéro est invalide. */
export function normalizePhoneNumber(phone: string): string {
  const result = parsePhone(phone);
  return result.ok ? result.e164 : phone.replace(/[\s\-().]/g, "");
}

// Masque un numéro pour les logs et listes : indicatif visible, milieu masqué.
export function maskPhoneNumber(phone: string): string {
  return maskPhone(phone);
}
