"use client";

import { createAuthClient } from "better-auth/react";
import {
  twoFactorClient,
  magicLinkClient,
  adminClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import type { auth } from "@/lib/auth/auth";

export const authClient = createAuthClient({
  baseURL: process.env["NEXT_PUBLIC_APP_URL"],
  plugins: [
    inferAdditionalFields<typeof auth>(),
    twoFactorClient(),
    magicLinkClient(),
    adminClient(),
  ],
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
