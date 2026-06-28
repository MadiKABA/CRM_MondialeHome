"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TemplateCard } from "./template-card";
import { TemplatesFilters } from "./templates-filters";
import { DeleteTemplateDialog } from "./delete-template-dialog";
import { DuplicateTemplateDialog } from "./duplicate-template-dialog";
import { toggleTemplateActive } from "../server/actions";
import type { TemplateDTO, PaginatedTemplates } from "../types";

interface TemplatesPageProps {
  initialData: PaginatedTemplates;
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

export function TemplatesPage({ initialData, permissions }: TemplatesPageProps) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<TemplateDTO | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<TemplateDTO | null>(null);
  const [, startTransition] = useTransition();

  const handleToggleActive = (template: TemplateDTO) => {
    startTransition(async () => {
      const result = await toggleTemplateActive(template.id, !template.isActive);
      if (result.success) {
        toast.success(
          template.isActive ? `"${template.name}" désactivé` : `"${template.name}" activé`
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  const { templates, stats } = initialData;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="text-text-primary font-serif text-2xl font-bold">
            Templates Email
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Vos modèles de messages réutilisables
          </p>
        </div>

        {permissions.canCreate && (
          <Link href="/templates/nouveau">
            <Button className="bg-gold-deep hover:bg-gold-darker shrink-0 gap-2 text-white">
              <Plus className="size-4" />
              Nouveau template
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Total", value: stats.total, icon: "📋" },
          { label: "Actifs", value: stats.active, icon: "✅" },
          { label: "Canal Email", value: stats.emailCount, icon: "✉️" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border-cream-darker flex items-center gap-3 rounded-xl border bg-white p-4"
          >
            <span className="text-2xl">{stat.icon}</span>
            <div>
              <p className="text-text-primary text-xl font-bold">{stat.value}</p>
              <p className="text-text-muted text-xs">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <TemplatesFilters />

      {/* Grille */}
      {templates.length === 0 ? (
        <div className="border-cream-darker rounded-xl border-2 border-dashed p-16 text-center">
          <Mail className="text-text-muted mx-auto mb-4 size-10" />
          <p className="text-text-secondary mb-1 text-base font-medium">
            Aucun template email
          </p>
          <p className="text-text-muted mb-4 text-sm">
            Créez votre premier modèle de message
          </p>
          {permissions.canCreate && (
            <Link href="/templates/nouveau">
              <Button className="bg-gold-deep hover:bg-gold-darker gap-2 text-white">
                <Plus className="size-4" />
                Créer un template
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              permissions={permissions}
              onView={() => router.push(`/templates/${template.id}`)}
              onEdit={() => router.push(`/templates/${template.id}/modifier`)}
              onDuplicate={() => setDuplicateTarget(template)}
              onDelete={() => setDeleteTarget(template)}
              onToggleActive={() => handleToggleActive(template)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <DeleteTemplateDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        template={deleteTarget}
        onSuccess={() => {
          setDeleteTarget(null);
          router.refresh();
        }}
      />

      <DuplicateTemplateDialog
        open={!!duplicateTarget}
        onOpenChange={(open) => {
          if (!open) setDuplicateTarget(null);
        }}
        template={duplicateTarget}
        onSuccess={(newId) => {
          setDuplicateTarget(null);
          router.push(`/templates/${newId}/modifier`);
        }}
      />
    </div>
  );
}
