import { logger } from "@/lib/logger";

// Pas de "server-only" ici : ce module est importé par src/server/workers/sms.worker.ts,
// exécuté via tsx (pas de bundler Next.js) — server-only y jetterait une exception au chargement.

export type TwilioEnvironment = "test" | "production";

export interface SmsConfig {
  isTest: boolean;
  environment: TwilioEnvironment;
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

// Numéro "magic" fourni par Twilio pour les tests sandbox — jamais utilisable en prod.
const TWILIO_TEST_PHONE_NUMBERS = new Set([
  "+15005550006",
  "+15005550001",
  "+15005550007",
]);

function resolveIsTest(): boolean {
  const twilioEnv = process.env["TWILIO_ENV"];
  if (twilioEnv === "test") return true;
  if (twilioEnv === "production") return false;
  // TWILIO_ENV absent : test par défaut sauf en production (NODE_ENV) — sécurité par défaut
  return process.env["NODE_ENV"] !== "production";
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

const isTest = resolveIsTest();
const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
const authToken = requireEnv("TWILIO_AUTH_TOKEN");
const phoneNumber = requireEnv("TWILIO_PHONE_NUMBER");

logger.info(isTest ? "🧪 Twilio SMS — mode TEST" : "🚀 Twilio SMS — mode PRODUCTION");

if (!isTest && TWILIO_TEST_PHONE_NUMBERS.has(phoneNumber)) {
  logger.warn(
    "TWILIO_ENV=production mais TWILIO_PHONE_NUMBER est un numéro de test Twilio. Aucun SMS réel ne sera livré."
  );
}

export const smsConfig: SmsConfig = {
  isTest,
  environment: isTest ? "test" : "production",
  accountSid,
  authToken,
  phoneNumber,
};
