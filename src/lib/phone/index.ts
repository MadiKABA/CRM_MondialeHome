// Module téléphone — source de vérité unique (client, serveur, worker).
// PAS de "server-only" : importé par le worker tsx et les composants client.
import {
  parsePhoneNumberFromString as parseCore,
  getCountries as getCountriesCore,
  getCountryCallingCode as getCallingCodeCore,
  type CountryCode,
  type MetadataJson,
} from "libphonenumber-js/core";
import metadataJson from "libphonenumber-js/metadata.min.json";

// Métadonnées « min » passées explicitement : `libphonenumber-js/min` ne charge
// pas son JSON correctement sous tsx (worker). Le wrapper gère l'interop CJS.
const metadata: MetadataJson =
  "countries" in metadataJson
    ? (metadataJson as MetadataJson)
    : (metadataJson as unknown as { default: MetadataJson }).default;

const parsePhoneNumberFromString = (text: string, country?: CountryCode) =>
  parseCore(text, { defaultCountry: country }, metadata);
const getCountries = () => getCountriesCore(metadata);
const getCountryCallingCode = (c: CountryCode) => getCallingCodeCore(c, metadata);

export type { CountryCode };

export const DEFAULT_COUNTRY: CountryCode = "SN";

export type PhoneParseResult =
  | { ok: true; e164: string; country: CountryCode | undefined }
  | { ok: false; reason: "empty" | "invalid" };

/** Retire espaces, tirets, points, parenthèses ; convertit le préfixe 00 en +. */
export function cleanPhoneInput(raw: string): string {
  const cleaned = raw.replace(/[\s \-.()]/g, "");
  return cleaned.startsWith("00") ? `+${cleaned.slice(2)}` : cleaned;
}

/**
 * Normalise un numéro en E.164. Une saisie sans indicatif est interprétée
 * avec `defaultCountry` (Sénégal par défaut).
 */
export function parsePhone(
  raw: string | null | undefined,
  defaultCountry: CountryCode = DEFAULT_COUNTRY
): PhoneParseResult {
  const cleaned = cleanPhoneInput(raw ?? "");
  if (!cleaned) return { ok: false, reason: "empty" };

  const attempt = (input: string) => {
    const parsed = parsePhoneNumberFromString(input, defaultCountry);
    return parsed?.isValid() ? parsed : null;
  };

  // Tolère le 0 national initial (« 0612345678 », « 077… »)
  const parsed =
    attempt(cleaned) ??
    (!cleaned.startsWith("+") && cleaned.startsWith("0")
      ? attempt(cleaned.slice(1))
      : null);

  if (!parsed) return { ok: false, reason: "invalid" };
  return { ok: true, e164: parsed.number, country: parsed.country };
}

export function isValidPhone(
  raw: string | null | undefined,
  country?: CountryCode
): boolean {
  return parsePhone(raw, country).ok;
}

/** Pays déduit d'un numéro E.164 (indicatif), si reconnu. */
export function getPhoneCountry(
  e164: string | null | undefined
): CountryCode | undefined {
  if (!e164) return undefined;
  const res = parsePhone(e164);
  return res.ok ? res.country : undefined;
}

/** « +221771234567 » → « +221 77 123 45 67 » ; retourne l'entrée si non reconnue. */
export function formatPhoneDisplay(e164: string | null | undefined): string {
  if (!e164) return "";
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? parsed.formatInternational() : e164;
}

/** Masque le milieu : indicatif visible, 2 premiers et 2 derniers chiffres nationaux. */
export function maskPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed) return "+** *** ** **";
  const national = parsed.nationalNumber;
  const prefix = `+${parsed.countryCallingCode}`;
  if (national.length < 5) return `${prefix} ** ***`;
  return `${prefix} ${national.slice(0, 2)} *** ** ${national.slice(-2)}`;
}

/**
 * Variantes à chercher (`contains`) dans les numéros stockés en E.164 :
 * fonctionne avec ou sans « + », avec ou sans espaces, avec ou sans 0 initial.
 * Retourne [] si la saisie ne contient pas assez de chiffres.
 */
export function phoneSearchTerms(query: string): string[] {
  const digits = query.replace(/\D/g, "");
  if (digits.length < 3) return [];
  const terms = new Set<string>([digits]);
  const noZeros = digits.replace(/^0+/, "");
  if (noZeros.length >= 3) terms.add(noZeros);
  return [...terms];
}

// ── Pays ────────────────────────────────────────────────────────────────────

export interface PhoneCountry {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

// Afrique de l'Ouest d'abord, puis diaspora et voisins fréquents
const PRIORITY: CountryCode[] = [
  "SN",
  "ML",
  "CI",
  "GN",
  "GM",
  "MR",
  "BF",
  "NE",
  "TG",
  "BJ",
  "GW",
  "CV",
  "GH",
  "NG",
  "FR",
  "BE",
  "ES",
  "IT",
  "DE",
  "GB",
  "CH",
  "PT",
  "US",
  "CA",
  "MA",
  "DZ",
  "TN",
];

export function countryFlag(code: CountryCode): string {
  return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

let cached: {
  priority: PhoneCountry[];
  others: PhoneCountry[];
  all: PhoneCountry[];
} | null = null;

export function getPhoneCountries() {
  if (cached) return cached;
  const names = new Intl.DisplayNames(["fr"], { type: "region" });
  const build = (code: CountryCode): PhoneCountry => ({
    code,
    name: names.of(code) ?? code,
    dialCode: `+${getCountryCallingCode(code)}`,
    flag: countryFlag(code),
  });
  const priority = PRIORITY.map(build);
  const others = getCountries()
    .filter((c) => !PRIORITY.includes(c))
    .map(build)
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  cached = { priority, others, all: [...priority, ...others] };
  return cached;
}

export function getCountryName(code: CountryCode): string {
  return getPhoneCountries().all.find((c) => c.code === code)?.name ?? code;
}
