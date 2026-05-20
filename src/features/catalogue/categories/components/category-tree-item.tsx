"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toggleCategoryActive } from "../server/actions";
import type { CategoryDTO, CategoryTreeNode } from "../types";

interface CategoryTreeItemProps {
  node: CategoryTreeNode;
  onEdit: (category: CategoryDTO) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (category: CategoryDTO) => void;
  canManage: boolean;
}

export function CategoryTreeItem({
  node,
  onEdit,
  onAddChild,
  onDelete,
  canManage,
}: CategoryTreeItemProps) {
  const [expanded, setExpanded] = useState(node.depth < 1);
  const [isPending, startTransition] = useTransition();

  const hasChildren = node.children.length > 0;
  const indent = node.depth * 20;

  function handleToggleActive() {
    startTransition(async () => {
      const result = await toggleCategoryActive(node.id, !node.isActive);
      if (!result.success) toast.error(result.error);
    });
  }

  return (
    <div>
      <div
        className={cn(
          "group hover:bg-cream/50 flex items-center gap-2 rounded-md px-2 py-2 transition-colors",
          !node.isActive && "opacity-60"
        )}
        style={{ paddingLeft: `${indent + 8}px` }}
      >
        {/* Bouton expand/collapse */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "text-muted-foreground hover:text-foreground flex size-5 shrink-0 items-center justify-center rounded transition-colors",
            !hasChildren && "invisible"
          )}
          aria-label={expanded ? "Réduire" : "Développer"}
        >
          {expanded ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        {/* Icône */}
        {node.icon && (
          <span className="shrink-0 text-base leading-none" aria-hidden>
            {node.icon}
          </span>
        )}

        {/* Nom */}
        <span className="flex-1 truncate text-sm font-medium">{node.name}</span>

        {/* Badges */}
        <div className="flex shrink-0 items-center gap-1.5">
          {hasChildren && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {node.children.length} sous-cat
            </Badge>
          )}
          {node.articleCount > 0 && (
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
              {node.articleCount} article{node.articleCount > 1 ? "s" : ""}
            </Badge>
          )}
          {!node.isActive && (
            <Badge
              variant="outline"
              className="h-5 border-amber-300 bg-amber-50 px-1.5 text-[10px] text-amber-700"
            >
              Inactif
            </Badge>
          )}
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground size-7"
              onClick={() => onEdit(node)}
              title="Modifier"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground size-7"
              onClick={() => onAddChild(node.id)}
              title="Ajouter une sous-catégorie"
            >
              <Plus className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-muted-foreground size-7",
                node.isActive ? "hover:text-amber-600" : "hover:text-green-600"
              )}
              onClick={handleToggleActive}
              disabled={isPending}
              title={node.isActive ? "Désactiver" : "Activer"}
            >
              {node.isActive ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-7 hover:text-red-600"
              onClick={() => onDelete(node)}
              title="Supprimer"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Enfants */}
      {expanded && hasChildren && (
        <div className="border-cream-darker relative ml-[17px] border-l">
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onDelete={onDelete}
              canManage={canManage}
            />
          ))}
        </div>
      )}
    </div>
  );
}
