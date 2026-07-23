import { logger } from "@/lib/logger";

// Pas de "server-only" ici : ce module est importé par src/server/workers/sms.worker.ts,
// exécuté via tsx (pas de bundler Next.js) — server-only y jetterait une exception au chargement.

export type SmsEnvironment = "sandbox" | "production";

export interface SmsConfig {
  isSandbox: boolean;
  environment: SmsEnvironment;
  username: string;
  apiKey: string;
  senderId: string | null;
}

function resolveIsSandbox(): boolean {
  const atEnv = process.env["AT_ENV"];
  if (atEnv === "sandbox") return true;
  if (atEnv === "production") return false;
  // AT_ENV absent : sandbox par défaut sauf en production (NODE_ENV)
  return process.env["NODE_ENV"] !== "production";
}

const isSandbox = resolveIsSandbox();
const username = process.env["AT_USERNAME"] ?? "sandbox";
const apiKey = process.env["AT_API_KEY"] ?? "";
const senderIdRaw = process.env["AT_SENDER_ID"];
const senderId = senderIdRaw && senderIdRaw.trim() !== "" ? senderIdRaw : null;

logger.info(
  isSandbox
    ? "🧪 Africa's Talking — mode SANDBOX"
    : "🚀 Africa's Talking — mode PRODUCTION"
);

if (isSandbox && username.toLowerCase() !== "sandbox") {
  logger.warn("AT_ENV=sandbox mais AT_USERNAME n'est pas 'sandbox'. Corriger .env.local");
}
if (!isSandbox && username.toLowerCase() === "sandbox") {
  logger.warn(
    "AT_ENV=production mais AT_USERNAME est 'sandbox'. Le Sender ID réel sera ignoré."
  );
}

export const smsConfig: SmsConfig = {
  isSandbox,
  environment: isSandbox ? "sandbox" : "production",
  username,
  apiKey,
  senderId,
};
