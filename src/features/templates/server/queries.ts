import "server-only";

import { db } from "@/lib/db";
import { getHeaderConfig } from "../types";
import type { TemplateDTO, PaginatedTemplates, TemplateProduct } from "../types";
import type { TemplateFilters } from "../schemas/template.schema";

// ── Select partagé ────────────────────────────────────────────────────────────

const TEMPLATE_SELECT = {
  id: true,
  name: true,
  description: true,
  channel: true,
  category: true,
  campaignType: true,
  productCategory: true,
  language: true,
  subject: true,
  preheader: true,
  content: true,
  conclusion: true,
  products: true,
  ctaText: true,
  ctaUrl: true,
  variables: true,
  isActive: true,
  isSystem: true,
  usageCount: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { name: true } },
} as const;

// ── Mapper Prisma → DTO ───────────────────────────────────────────────────────

function toDTO(
  t: Awaited<ReturnType<typeof db.template.findUnique>> & {
    createdBy?: { name: string } | null;
  }
): TemplateDTO {
  if (!t) throw new Error("Template is null");

  const products = Array.isArray(t.products)
    ? (t.products as unknown as TemplateProduct[])
    : [];
  const campaignType = t.campaignType ?? "Promotion";

  return {
    id: t.id,
    name: t.name,
    description: t.description,
    channel: t.channel as "EMAIL" | "SMS" | "WHATSAPP",
    // campaignType (String) exposé comme "category" dans le DTO
    category: t.campaignType as TemplateDTO["category"],
    productCategory: t.productCategory as TemplateDTO["productCategory"],
    language: t.language,
    subject: t.subject,
    preheader: t.preheader,
    content: t.content,
    conclusion: t.conclusion,
    products,
    ctaText: t.ctaText,
    ctaUrl: t.ctaUrl,
    variables: t.variables ?? [],
    isActive: t.isActive,
    isSystem: t.isSystem,
    usageCount: t.usageCount,
    lastUsedAt: t.lastUsedAt,
    createdByName: t.createdBy?.name ?? null,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    headerConfig: getHeaderConfig(campaignType, t.productCategory ?? null),
  };
}

// ── Liste paginée ─────────────────────────────────────────────────────────────

export async function getTemplates(
  filters: TemplateFilters
): Promise<PaginatedTemplates> {
  const skip = (filters.page - 1) * filters.limit;

  const where = {
    channel: "EMAIL",
    ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    ...(filters.category && { campaignType: filters.category }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" as const } },
        { subject: { contains: filters.search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [templates, total, emailCount, active] = await Promise.all([
    db.template.findMany({
      where,
      skip,
      take: filters.limit,
      orderBy: [{ isSystem: "desc" }, { usageCount: "desc" }, { createdAt: "desc" }],
      select: TEMPLATE_SELECT,
    }),
    db.template.count({ where }),
    db.template.count({ where: { channel: "EMAIL" } }),
    db.template.count({ where: { channel: "EMAIL", isActive: true } }),
  ]);

  return {
    templates: templates.map((t) => toDTO(t as Parameters<typeof toDTO>[0])),
    total,
    page: filters.page,
    totalPages: Math.ceil(total / filters.limit),
    stats: {
      total: emailCount,
      emailCount,
      active,
    },
  };
}

// ── Détail d'un template ──────────────────────────────────────────────────────

export async function getTemplateById(id: string): Promise<TemplateDTO | null> {
  const t = await db.template.findUnique({
    where: { id },
    select: TEMPLATE_SELECT,
  });
  return t ? toDTO(t as Parameters<typeof toDTO>[0]) : null;
}

// ── Vérifier l'unicité du nom ─────────────────────────────────────────────────

export async function isTemplateNameUnique(
  name: string,
  excludeId?: string
): Promise<boolean> {
  const existing = await db.template.findFirst({
    where: {
      name: { equals: name.trim(), mode: "insensitive" },
      channel: "EMAIL",
      ...(excludeId && { NOT: { id: excludeId } }),
    },
    select: { id: true },
  });
  return !existing;
}

// ── Templates actifs pour les campagnes (sans pagination) ─────────────────────

export async function getActiveEmailTemplates(): Promise<TemplateDTO[]> {
  const templates = await db.template.findMany({
    where: { channel: "EMAIL", isActive: true },
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
    select: TEMPLATE_SELECT,
  });
  return templates.map((t) => toDTO(t as Parameters<typeof toDTO>[0]));
}
