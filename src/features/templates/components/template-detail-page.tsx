"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Copy,
  Trash2,
  Send,
  ToggleLeft,
  ToggleRight,
  Calendar,
  User,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmailPreview } from "./email-preview";
import { SendTestDialog } from "./send-test-dialog";
import { DeleteTemplateDialog } from "./delete-template-dialog";
import { DuplicateTemplateDialog } from "./duplicate-template-dialog";
import { toggleTemplateActive } from "../server/actions";
import type { TemplateDTO } from "../types";

interface TemplateDetailPageProps {
  template: TemplateDTO;
  permissions: { canUpdate: boolean; canDelete: boolean };
}

export function TemplateDetailPage({ template, permissions }: TemplateDetailPageProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [sendTestOpen, setSendTestOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const header = template.headerConfig;

  const handleToggleActive = () => {
    startTransition(async () => {
      const result = await toggleTemplateActive(template.id, !template.isActive);
      if (result.success) {
        toast.success(template.isActive ? "Template désactivé" : "Template activé");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const createdAt = new Date(template.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header nav */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/templates">
            <Button
              variant="ghost"
              size="sm"
              className="text-text-secondary hover:text-text-primary mt-0.5 gap-1.5"
            >
              <ArrowLeft className="size-4" />
              Templates
            </Button>
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-text-primary font-serif text-2xl font-bold">
                {template.name}
              </h1>
              {template.isSystem && (
                <Badge className="border-cream-darker bg-cream text-text-muted text-xs">
                  Système
                </Badge>
              )}
              <Badge
                className={
                  template.isActive
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-cream-darker bg-cream text-text-muted"
                }
              >
                {template.isActive ? "Actif" : "Inactif"}
              </Badge>
            </div>

            {template.description && (
              <p className="text-text-secondary mt-1 text-sm">{template.description}</p>
            )}

            <div className="text-text-muted mt-2 flex flex-wrap items-center gap-3 text-xs">
              {template.createdByName && (
                <span className="flex items-center gap-1">
                  <User className="size-3" />
                  {template.createdByName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {createdAt}
              </span>
              {template.usageCount > 0 && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3" />
                  Utilisé {template.usageCount} fois
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSendTestOpen(true)}
            className="border-cream-darker hover:bg-cream gap-1.5"
          >
            <Send className="size-4" />
            Test
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDuplicateOpen(true)}
            className="border-cream-darker hover:bg-cream gap-1.5"
          >
            <Copy className="size-4" />
            Dupliquer
          </Button>

          {permissions.canUpdate && !template.isSystem && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleActive}
                className="border-cream-darker hover:bg-cream gap-1.5"
              >
                {template.isActive ? (
                  <>
                    <ToggleRight className="size-4" />
                    Désactiver
                  </>
                ) : (
                  <>
                    <ToggleLeft className="size-4" />
                    Activer
                  </>
                )}
              </Button>

              <Link href={`/templates/${template.id}/modifier`}>
                <Button
                  size="sm"
                  className="bg-gold-deep hover:bg-gold-darker gap-1.5 text-white"
                >
                  <Pencil className="size-4" />
                  Modifier
                </Button>
              </Link>
            </>
          )}

          {permissions.canDelete && !template.isSystem && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="size-4" />
              Supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Corps sur 2 colonnes */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Infos + variables */}
        <div className="space-y-4">
          {/* Type et header */}
          <div className="border-cream-darker rounded-xl border bg-white p-4">
            <h2 className="text-text-primary mb-3 text-sm font-semibold">
              Configuration
            </h2>

            {template.category && (
              <div
                className="mb-3 rounded-lg px-3 py-2 text-center text-sm font-medium"
                style={{
                  backgroundColor: header.bgColor,
                  color: header.textColor,
                }}
              >
                <span className="mr-1.5">{header.icon}</span>
                {header.title}
              </div>
            )}

            <dl className="space-y-2 text-xs">
              {template.category && (
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">Type</dt>
                  <dd className="text-text-primary font-medium">{template.category}</dd>
                </div>
              )}
              {template.productCategory && (
                <div className="flex items-center justify-between">
                  <dt className="text-text-muted">Catégorie</dt>
                  <dd className="text-text-primary font-medium">
                    {template.productCategory}
                  </dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Langue</dt>
                <dd className="text-text-primary font-medium uppercase">
                  {template.language}
                </dd>
              </div>
            </dl>
          </div>

          {/* Objet */}
          {template.subject && (
            <div className="border-cream-darker rounded-xl border bg-white p-4">
              <h2 className="text-text-primary mb-2 text-sm font-semibold">
                Objet de l&apos;email
              </h2>
              <p className="text-text-secondary text-sm">{template.subject}</p>
              {template.preheader && (
                <>
                  <p className="text-text-muted mt-2 text-xs font-medium">Préheader</p>
                  <p className="text-text-muted text-xs">{template.preheader}</p>
                </>
              )}
            </div>
          )}

          {/* Variables utilisées */}
          {template.variables.length > 0 && (
            <div className="border-cream-darker rounded-xl border bg-white p-4">
              <h2 className="text-text-primary mb-2 text-sm font-semibold">
                Variables ({template.variables.length})
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {template.variables.map((v) => (
                  <span
                    key={v}
                    className="bg-gold-light/40 text-gold-darker rounded px-2 py-0.5 font-mono text-[11px]"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Produits */}
          {template.products.length > 0 && (
            <div className="border-cream-darker rounded-xl border bg-white p-4">
              <h2 className="text-text-primary mb-2 text-sm font-semibold">
                Produits ({template.products.length})
              </h2>
              <div className="space-y-2">
                {template.products.map((product, i) => (
                  <div
                    key={product.id ?? i}
                    className="border-cream-darker rounded-lg border px-3 py-2 text-xs"
                  >
                    <p className="text-text-primary font-medium">{product.title}</p>
                    {product.originalPrice != null && (
                      <p className="text-text-muted mt-0.5">
                        {product.promoPrice != null ? (
                          <>
                            <span className="text-red-500 line-through">
                              {product.originalPrice.toLocaleString("fr-FR")} F
                            </span>{" "}
                            <span className="text-gold-darker font-semibold">
                              {product.promoPrice.toLocaleString("fr-FR")} F
                            </span>
                          </>
                        ) : (
                          `${product.originalPrice.toLocaleString("fr-FR")} F`
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview email */}
        <div className="lg:col-span-2">
          <div
            className="border-cream-darker overflow-hidden rounded-xl border bg-white"
            style={{ height: "calc(100vh - 180px)" }}
          >
            <EmailPreview html={null} subject={template.subject} />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SendTestDialog
        open={sendTestOpen}
        onOpenChange={setSendTestOpen}
        templateId={template.id}
        templateName={template.name}
      />

      <DeleteTemplateDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        template={template}
        onSuccess={() => router.push("/templates")}
      />

      <DuplicateTemplateDialog
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        template={template}
        onSuccess={(newId) => router.push(`/templates/${newId}/modifier`)}
      />
    </div>
  );
}
