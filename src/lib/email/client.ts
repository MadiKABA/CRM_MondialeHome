import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env["RESEND_API_KEY"];
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY manquant dans .env.local\n" +
          "Obtenez votre clé sur https://resend.com/api-keys"
      );
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}
