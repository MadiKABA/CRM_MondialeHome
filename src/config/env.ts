import { z } from "zod";

const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid URL").optional(),

  // Better Auth
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Redis
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL"),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().min(1),

  // Brevo
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email("BREVO_SENDER_EMAIL must be a valid email"),
  BREVO_SENDER_NAME: z.string().min(1),

  // Meta WhatsApp
  META_WHATSAPP_TOKEN: z.string().optional(),
  META_PHONE_NUMBER_ID: z.string().optional(),
  META_WEBHOOK_VERIFY_TOKEN: z.string().optional(),

  // Sentry
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Node
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

function validateEnv() {
  const isServer = typeof window === "undefined";

  if (isServer) {
    const parsed = serverEnvSchema.safeParse(process.env);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      console.error("❌ Invalid server environment variables:");
      Object.entries(errors).forEach(([key, messages]) => {
        console.error(`  ${key}: ${messages?.join(", ")}`);
      });
      // Only throw in non-test environments to allow test isolation
      if (process.env["NODE_ENV"] !== "test") {
        throw new Error("Invalid environment variables. See errors above.");
      }
    }
  }

  const clientParsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"],
    NEXT_PUBLIC_SENTRY_DSN: process.env["NEXT_PUBLIC_SENTRY_DSN"],
  });

  if (!clientParsed.success) {
    const errors = clientParsed.error.flatten().fieldErrors;
    console.error("❌ Invalid client environment variables:");
    Object.entries(errors).forEach(([key, messages]) => {
      console.error(`  ${key}: ${messages?.join(", ")}`);
    });
  }
}

// Validate at module load time (fail fast)
validateEnv();

export const env = {
  // Database
  DATABASE_URL: process.env["DATABASE_URL"] as string,
  DIRECT_URL: process.env["DIRECT_URL"],

  // Better Auth
  BETTER_AUTH_SECRET: process.env["BETTER_AUTH_SECRET"] as string,
  BETTER_AUTH_URL: process.env["BETTER_AUTH_URL"] as string,
  GOOGLE_CLIENT_ID: process.env["GOOGLE_CLIENT_ID"],
  GOOGLE_CLIENT_SECRET: process.env["GOOGLE_CLIENT_SECRET"],

  // Redis
  REDIS_URL: process.env["REDIS_URL"] as string,

  // Twilio
  TWILIO_ACCOUNT_SID: process.env["TWILIO_ACCOUNT_SID"] as string,
  TWILIO_AUTH_TOKEN: process.env["TWILIO_AUTH_TOKEN"] as string,
  TWILIO_PHONE_NUMBER: process.env["TWILIO_PHONE_NUMBER"] as string,

  // Brevo
  BREVO_API_KEY: process.env["BREVO_API_KEY"] as string,
  BREVO_SENDER_EMAIL: process.env["BREVO_SENDER_EMAIL"] as string,
  BREVO_SENDER_NAME: process.env["BREVO_SENDER_NAME"] as string,

  // Meta WhatsApp
  META_WHATSAPP_TOKEN: process.env["META_WHATSAPP_TOKEN"],
  META_PHONE_NUMBER_ID: process.env["META_PHONE_NUMBER_ID"],
  META_WEBHOOK_VERIFY_TOKEN: process.env["META_WEBHOOK_VERIFY_TOKEN"],

  // Sentry
  NEXT_PUBLIC_SENTRY_DSN: process.env["NEXT_PUBLIC_SENTRY_DSN"],
  SENTRY_AUTH_TOKEN: process.env["SENTRY_AUTH_TOKEN"],
  SENTRY_ORG: process.env["SENTRY_ORG"],
  SENTRY_PROJECT: process.env["SENTRY_PROJECT"],

  // App
  NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"] as string,
  NODE_ENV: (process.env["NODE_ENV"] ?? "development") as
    | "development"
    | "test"
    | "production",
  isDev: process.env["NODE_ENV"] === "development",
  isProd: process.env["NODE_ENV"] === "production",
  isTest: process.env["NODE_ENV"] === "test",
} as const;
