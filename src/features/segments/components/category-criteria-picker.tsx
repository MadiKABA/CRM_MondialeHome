"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadCategoriesForCriteria } from "../server/actions";

interface CategoryOption {
  id: string;
  name: string;
  parentName: string | null;
}

interface CategoryCriteriaPickerProps {
  value: string | null;
  onChange: (id: string, name: string) => void;
}

export function CategoryCriteriaPicker({ value, onChange }: CategoryCriteriaPickerProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await loadCategoriesForCriteria();
      if (result.success && result.data) {
        setCategories(result.data);
      }
    });
  }, []);

  return (
    <Select
      value={value ?? ""}
      onValueChange={(v) => {
        const selected = categories.find((c) => c.id === v);
        if (selected) onChange(selected.id, selected.name);
      }}
      disabled={isPending}
    >
      <SelectTrigger className="h-8 text-xs">
        <SelectValue
          placeholder={isPending ? "Chargement..." : "Sélectionner une catégorie..."}
        />
      </SelectTrigger>
      <SelectContent>
        {categories.map((cat) => (
          <SelectItem key={cat.id} value={cat.id} className="text-xs">
            {cat.parentName ? `${cat.parentName} → ${cat.name}` : cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
