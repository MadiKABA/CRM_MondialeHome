"use client";

import { Eye, Pencil, Copy, Trash2, ToggleLeft, ToggleRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TemplateDTO } from "../types";

interface TemplateCardProps {
  template: TemplateDTO;
  permissions: { canCreate: boolean; canUpdate: boolean; canDelete: boolean };
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

export function TemplateCard({
  template,
  permissions,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleActive,
}: TemplateCardProps) {
  const header = template.headerConfig;

  const contentPreview = template.content
    ? template.content.replace(/\n/g, " ").slice(0, 90) +
      (template.content.length > 90 ? "..." : "")
    : (template.subject ?? "");

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md",
        "border-l-4",
        !template.isActive && "opacity-60"
      )}
      style={{ borderLeftColor: header.bgColor }}
    >
      {/* Mini header coloré */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ backgroundColor: header.bgColor }}
      >
        <span className="text-lg">{header.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold tracking-wide text-white/90 uppercase">
            {template.category ?? "Email"}
            {template.productCategory ? ` · ${template.productCategory}` : ""}
          </p>
        </div>
        <div
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            template.isActive ? "bg-white/20 text-white" : "bg-black/20 text-white/60"
          )}
        >
          {template.isActive ? "Actif" : "Inactif"}
        </div>
      </div>

      {/* Corps */}
      <div className="flex-1 space-y-2 p-4">
        <h3 className="text-text-primary text-sm leading-tight font-semibold">
          {template.name}
          {template.isSystem && (
            <Badge className="border-cream-darker bg-cream text-text-muted ml-2 text-[10px]">
              Système
            </Badge>
          )}
        </h3>

        {template.subject && (
          <div className="flex items-start gap-1.5">
            <Mail className="text-text-muted mt-0.5 size-3 shrink-0" />
            <p className="text-text-secondary truncate text-xs">{template.subject}</p>
          </div>
        )}

        {contentPreview && (
          <p className="text-text-muted line-clamp-2 text-xs leading-relaxed">
            {contentPreview}
          </p>
        )}
      </div>

      {/* Méta */}
      <div className="bg-cream/40 border-cream-darker flex items-center justify-between border-t px-4 py-2">
        <span className="text-text-muted text-[10px]">
          {template.usageCount > 0
            ? `Utilisé ${template.usageCount} fois`
            : "Jamais utilisé"}
        </span>
        {template.variables.length > 0 && (
          <span className="text-text-muted text-[10px]">
            {template.variables.length} variable(s)
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="border-cream-darker flex flex-wrap gap-1.5 border-t p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onView}
          className="text-text-secondary hover:text-text-primary hover:bg-cream h-8 gap-1.5 text-xs"
        >
          <Eye className="size-3.5" />
          Voir
        </Button>

        {permissions.canUpdate && !template.isSystem && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-gold-deep hover:text-gold-darker hover:bg-gold-light/30 h-8 gap-1.5 text-xs"
          >
            <Pencil className="size-3.5" />
            Modifier
          </Button>
        )}

        {permissions.canCreate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            className="text-text-secondary hover:text-text-primary hover:bg-cream h-8 gap-1.5 text-xs"
          >
            <Copy className="size-3.5" />
            Dupliquer
          </Button>
        )}

        {permissions.canUpdate && !template.isSystem && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleActive}
            className={cn(
              "ml-auto h-8 gap-1.5 text-xs",
              template.isActive
                ? "text-text-muted hover:text-text-secondary hover:bg-cream"
                : "text-gold-deep hover:text-gold-darker hover:bg-gold-light/30"
            )}
          >
            {template.isActive ? (
              <>
                <ToggleRight className="size-3.5" />
                Désactiver
              </>
            ) : (
              <>
                <ToggleLeft className="size-3.5" />
                Activer
              </>
            )}
          </Button>
        )}

        {permissions.canDelete && !template.isSystem && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 gap-1.5 text-xs text-red-500 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="size-3.5" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
