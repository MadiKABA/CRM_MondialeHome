import { logger } from "@/lib/logger";

// Pas de "server-only" ici : ce module est importé par src/server/workers/sms.worker.ts,
// exécuté via tsx (pas de bundler Next.js) — server-only y jetterait une exception au chargement.

export type MtargetEnvironment = "sandbox" | "production";

export interface MtargetConfig {
  readonly isSandbox: boolean;
  readonly environment: MtargetEnvironment;
  readonly apiUrl: string;
  readonly balanceUrl: string;
  readonly username: string;
  readonly password: string;
  readonly serviceId: string | null;
  readonly senderId: string;
  readonly timeout: number;
}

// URLs Mtarget en dur — jamais dérivées du .env.
const MTARGET_PRODUCTION_URL = "https://api-public.mtarget.fr/messages";
const MTARGET_SANDBOX_URL = "https://api-test.mtarget.fr/messages";
const MTARGET_BALANCE_URL = "https://api-public.mtarget.fr/balance";

function resolveIsSandbox(): boolean {
  return process.env["MTARGET_ENV"] === "sandbox";
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`${name} manquant dans .env.local`);
  }
  return value;
}

const isSandbox = resolveIsSandbox();
const username = requireEnv("MTARGET_USERNAME");
const password = requireEnv("MTARGET_PASSWORD");
const serviceId = process.env["MTARGET_SERVICE_ID"]?.trim() || null;
const senderId = process.env["MTARGET_SENDER_ID"]?.trim() || "MondialHome";

logger.info(
  isSandbox ? "🧪 Mtarget SMS — mode SANDBOX" : "🚀 Mtarget SMS — mode PRODUCTION"
);
logger.info({ username }, "SMS provider: Mtarget");

export const mtargetConfig: MtargetConfig = {
  isSandbox,
  environment: isSandbox ? "sandbox" : "production",
  apiUrl: isSandbox ? MTARGET_SANDBOX_URL : MTARGET_PRODUCTION_URL,
  balanceUrl: MTARGET_BALANCE_URL,
  username,
  password,
  serviceId,
  senderId,
  timeout: 45_000,
};
