import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { twoFactor, magicLink, admin } from "better-auth/plugins";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

const googleConfig =
  process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]
    ? {
        clientId: process.env["GOOGLE_CLIENT_ID"],
        clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
      }
    : undefined;

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  baseURL: process.env["BETTER_AUTH_URL"],
  secret: process.env["BETTER_AUTH_SECRET"],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // TODO: activer en production
    minPasswordLength: 8,
  },

  ...(googleConfig
    ? {
        socialProviders: {
          google: googleConfig,
        },
      }
    : {}),

  user: {
    additionalFields: {
      isSuperAdmin: {
        type: "boolean",
        defaultValue: false,
        input: false,
        fieldName: "isSuperAdmin",
      },
    },
  },

  plugins: [
    twoFactor({
      issuer: "Mondial Home CRM",
    }),
    magicLink({
      sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
        // TODO: implémenter l'envoi via Brevo
        logger.info({ email, url }, "Magic link requested");
      },
    }),
    admin(),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  rateLimit: {
    window: 60,
    max: 10,
  },

  trustedOrigins: [process.env["BETTER_AUTH_URL"] ?? "http://localhost:3000"],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
