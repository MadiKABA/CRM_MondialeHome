"use client";

import { createAuthClient } from "better-auth/react";
import {
  twoFactorClient,
  magicLinkClient,
  adminClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env["NEXT_PUBLIC_APP_URL"],
  plugins: [twoFactorClient(), magicLinkClient(), adminClient()],
});

export const { signIn, signOut, signUp, useSession, getSession } = authClient;
