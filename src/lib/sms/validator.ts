const INTERNATIONAL_PHONE_REGEX = /^\+\d{7,15}$/;
const SENEGAL_PHONE_REGEX = /^\+221\d{9}$/;

export function isValidSmsNumber(phone: string): boolean {
  return INTERNATIONAL_PHONE_REGEX.test(phone);
}

export function isValidSenegalesePhone(phone: string): boolean {
  return SENEGAL_PHONE_REGEX.test(phone);
}

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-().]/g, "");

  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("221")) return `+${cleaned}`;
  if (/^\d{9}$/.test(cleaned)) return `+221${cleaned}`;

  return cleaned;
}

// Masque un numéro pour affichage — révèle uniquement les 2 premiers et
// 2 derniers chiffres du numéro local, ex : "+221771234567" → "+221 77 *** ** 67".
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("221") ? digits.slice(3) : digits;

  if (local.length < 4) return "+221 ** *** ** **";

  const first = local.slice(0, 2);
  const last = local.slice(-2);
  return `+221 ${first} *** ** ${last}`;
}
