export const EMAIL_CONFIG = {
  from: {
    email: process.env["RESEND_FROM_EMAIL"] ?? "onboarding@resend.dev",
    name: process.env["RESEND_FROM_NAME"] ?? "Mondial Home CRM",
    get formatted() {
      return `${this.name} <${this.email}>`;
    },
  },

  get appUrl(): string {
    const url = process.env["NEXT_PUBLIC_APP_URL"];
    if (!url) return "http://localhost:3000";
    return url.replace(/\/$/, "");
  },
} as const;
