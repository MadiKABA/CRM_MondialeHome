import "server-only";
import { buildEmailHtml } from "@/features/templates/lib/html-builder";
import { buildClientData } from "@/features/templates/lib/renderer";
import type { TemplateDTO } from "@/features/templates/types";
import type { EmailCampaignData } from "../types";

export interface ClientEmailData {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  city: string | null;
  district: string | null;
  totalSpent: number;
  totalOrders: number;
  lastPurchaseAt: Date | null;
  emailConsent: boolean;
}

export interface PersonalizedEmail {
  to: string;
  subject: string;
  html: string;
}

export interface EligibilityCheck {
  eligible: boolean;
  reason?: string;
}

export function checkClientEligibility(client: ClientEmailData): EligibilityCheck {
  if (!client.emailConsent) {
    return { eligible: false, reason: "Pas de consentement email" };
  }

  if (!client.email?.trim()) {
    return { eligible: false, reason: "Email manquant" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(client.email)) {
    return { eligible: false, reason: `Email invalide : ${client.email}` };
  }

  return { eligible: true };
}

export function personalizeEmail(
  client: ClientEmailData,
  template: TemplateDTO,
  campaignData: EmailCampaignData
): PersonalizedEmail {
  const clientData = buildClientData({
    firstName: client.firstName,
    lastName: client.lastName,
    city: client.city,
    district: client.district,
    totalSpent: client.totalSpent,
    totalOrders: client.totalOrders,
    lastPurchaseAt: client.lastPurchaseAt,
  });

  const html = buildEmailHtml({
    campaignType: template.category ?? "Promotion",
    productCategory: template.productCategory ?? null,
    subject: template.subject ?? "",
    content: template.content,
    conclusion: template.conclusion,
    bannerImageUrl: campaignData.bannerImageUrl,
    articles: campaignData.articles,
    ctaText: campaignData.ctaText,
    ctaUrl: campaignData.ctaUrl,
    clientData,
    campaignVars: campaignData.campaignVars,
  });

  const subject = personalizeSubject(
    template.subject ?? "Message de Mondial Home",
    clientData,
    campaignData.campaignVars
  );

  return { to: client.email, subject, html };
}

function personalizeSubject(
  subject: string,
  clientData: Record<string, string>,
  campaignVars: Record<string, string>
): string {
  const allVars = { ...clientData, ...campaignVars };
  return Object.entries(allVars).reduce(
    (s, [key, value]) => s.replaceAll(key, value),
    subject
  );
}
