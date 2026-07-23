"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Copy,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Calendar,
  User,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteTemplateDialog } from "@/features/templates/components/delete-template-dialog";
import { DuplicateTemplateDialog } from "@/features/templates/components/duplicate-template-dialog";
import { toggleTemplateActive } from "@/features/templates/server/actions";
import { analyzeMessage } from "@/lib/sms/character-counter";
import { SmsPreviewBubble } from "./sms-preview-bubble";
import type { TemplateDTO } from "@/features/templates/types";

interface SmsTemplateDetailPageProps {
  template: TemplateDTO;
  permissions: { canUpdate: boolean; canDelete: boolean };
}

export function SmsTemplateDetailPage({
  template,
  permissions,
}: SmsTemplateDetailPageProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const analysis = analyzeMessage(template.content ?? "");

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link href="/templates?channel=sms">
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
              <Badge className="border-cream-darker bg-cream text-text-muted text-xs">
                SMS
              </Badge>
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
                  <MessageSquare className="size-3" />
                  Utilisé {template.usageCount} fois
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="border-cream-darker rounded-xl border bg-white p-4">
            <h2 className="text-text-primary mb-3 text-sm font-semibold">Analyse</h2>
            <dl className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Caractères</dt>
                <dd className="text-text-primary font-medium">{analysis.charCount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Nombre de SMS</dt>
                <dd className="text-text-primary font-medium">{analysis.smsCount}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Coût par client</dt>
                <dd className="text-text-primary font-medium">
                  {analysis.costPerClient} FCFA
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-text-muted">Encodage</dt>
                <dd className="text-text-primary font-medium">{analysis.encoding}</dd>
              </div>
            </dl>
          </div>

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
        </div>

        <div className="lg:col-span-2">
          <div
            className="border-cream-darker overflow-hidden rounded-xl border bg-white"
            style={{ height: "calc(100vh - 280px)" }}
          >
            <SmsPreviewBubble message={template.content ?? ""} />
          </div>
        </div>
      </div>

      <DeleteTemplateDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        template={template}
        onSuccess={() => router.push("/templates?channel=sms")}
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
