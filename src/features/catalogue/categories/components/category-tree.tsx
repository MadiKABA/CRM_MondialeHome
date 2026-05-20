"use client";

import { useState } from "react";
import { Plus, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryTreeItem } from "./category-tree-item";
import { CategoryFormDialog } from "./category-form-dialog";
import { DeleteCategoryDialog } from "./delete-category-dialog";
import type { CategoryDTO, CategoryTreeNode, CategorySelectOption } from "../types";

interface CategoryTreeProps {
  tree: CategoryTreeNode[];
  selectOptions: CategorySelectOption[];
  canManage: boolean;
}

export function CategoryTree({ tree, selectOptions, canManage }: CategoryTreeProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryDTO | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryDTO | null>(null);
  const [addChildParentId, setAddChildParentId] = useState<string | null>(null);

  function handleEdit(category: CategoryDTO) {
    setEditTarget(category);
    setAddChildParentId(null);
    setFormOpen(true);
  }

  function handleAddChild(parentId: string) {
    setEditTarget(null);
    setAddChildParentId(parentId);
    setFormOpen(true);
  }

  function handleDelete(category: CategoryDTO) {
    setDeleteTarget(category);
    setDeleteOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) {
      setEditTarget(null);
      setAddChildParentId(null);
    }
  }

  if (tree.length === 0) {
    return (
      <div className="border-cream-darker flex flex-col items-center justify-center rounded-xl border border-dashed py-16">
        <div className="bg-muted mb-3 flex size-12 items-center justify-center rounded-full">
          <TreePine className="text-muted-foreground size-6" />
        </div>
        <p className="mb-1 text-sm font-medium">Aucune catégorie</p>
        <p className="text-muted-foreground mb-4 text-xs">
          Créez votre première catégorie pour organiser votre catalogue
        </p>
        {canManage && (
          <Button
            size="sm"
            className="bg-gold-deep hover:bg-gold-darker gap-1.5 text-white"
            onClick={() => {
              setEditTarget(null);
              setAddChildParentId(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" />
            Créer une catégorie
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="border-cream-darker bg-card rounded-xl border">
        <div className="divide-cream-darker/50 divide-y">
          {tree.map((node) => (
            <CategoryTreeItem
              key={node.id}
              node={node}
              onEdit={handleEdit}
              onAddChild={handleAddChild}
              onDelete={handleDelete}
              canManage={canManage}
            />
          ))}
        </div>
      </div>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        category={editTarget}
        parentId={addChildParentId}
        selectOptions={selectOptions}
      />

      {deleteTarget && (
        <DeleteCategoryDialog
          category={deleteTarget}
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) setDeleteTarget(null);
          }}
        />
      )}
    </>
  );
}
