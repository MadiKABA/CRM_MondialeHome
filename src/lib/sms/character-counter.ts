const COST_PER_SMS_FCFA = 7;

// Alphabet GSM 03.38 de base — 1 septet par caractère
const GSM_7BIT_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";

// Caractères de l'extension GSM 03.38 — occupent 2 septets chacun
const GSM_7BIT_EXTENDED = "^{}\\[~]|€";

type GsmCharKind = "basic" | "extended" | "none";

function classifyChar(char: string): GsmCharKind {
  if (GSM_7BIT_BASIC.includes(char)) return "basic";
  if (GSM_7BIT_EXTENDED.includes(char)) return "extended";
  return "none";
}

export interface SmsMessageAnalysis {
  charCount: number;
  smsCount: number;
  encoding: "GSM7" | "UTF16";
  costPerClient: number;
  hasSpecialChars: boolean;
  warning: string | null;
}

export function analyzeMessage(message: string): SmsMessageAnalysis {
  const chars = Array.from(message);

  let hasNonGsm = false;
  let extendedCount = 0;

  for (const char of chars) {
    const kind = classifyChar(char);
    if (kind === "none") hasNonGsm = true;
    else if (kind === "extended") extendedCount++;
  }

  const encoding: "GSM7" | "UTF16" = hasNonGsm ? "UTF16" : "GSM7";
  const effectiveLength =
    encoding === "GSM7" ? chars.length + extendedCount : chars.length;
  const charCount = chars.length;
  const smsCount = calcSmsCount(effectiveLength, encoding);

  let warning: string | null = null;
  if (charCount > 306) {
    warning = "Message très long (> 306 caractères) — 3 SMS ou plus par client.";
  } else if (charCount > 160) {
    warning = "Message dépasse 160 caractères — sera envoyé en plusieurs SMS.";
  }

  return {
    charCount,
    smsCount,
    encoding,
    costPerClient: smsCount * COST_PER_SMS_FCFA,
    hasSpecialChars: encoding === "UTF16",
    warning,
  };
}

function calcSmsCount(effectiveLength: number, encoding: "GSM7" | "UTF16"): number {
  if (effectiveLength === 0) return 0;

  if (encoding === "GSM7") {
    return effectiveLength <= 160 ? 1 : Math.ceil(effectiveLength / 153);
  }

  return effectiveLength <= 70 ? 1 : Math.ceil(effectiveLength / 67);
}
