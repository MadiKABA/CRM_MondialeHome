"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryFormDialog } from "./category-form-dialog";
import type { CategorySelectOption } from "../types";

interface AddCategoryButtonProps {
  selectOptions?: CategorySelectOption[];
}

export function AddCategoryButton({ selectOptions = [] }: AddCategoryButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-gold-deep hover:bg-gold-darker gap-1.5 text-white"
      >
        <Plus className="size-4" />
        Nouvelle catégorie
      </Button>

      <CategoryFormDialog
        open={open}
        onOpenChange={setOpen}
        category={null}
        parentId={null}
        selectOptions={selectOptions}
      />
    </>
  );
}
