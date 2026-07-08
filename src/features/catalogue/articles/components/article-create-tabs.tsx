"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticleQuickCreateForm } from "./article-quick-create-form";
import { ArticleForm } from "./article-form";
import type { CategorySelectOption } from "@/features/catalogue/categories/types";

interface ArticleCreateTabsProps {
  categories: CategorySelectOption[];
  canManagePrices: boolean;
  canViewCost: boolean;
}

export function ArticleCreateTabs({
  categories,
  canManagePrices,
  canViewCost,
}: ArticleCreateTabsProps) {
  return (
    <Tabs defaultValue="quick">
      <TabsList>
        <TabsTrigger value="quick">Création rapide</TabsTrigger>
        <TabsTrigger value="full">Création complète</TabsTrigger>
      </TabsList>

      <TabsContent value="quick" className="pt-6">
        <ArticleQuickCreateForm categories={categories} />
      </TabsContent>

      <TabsContent value="full" className="pt-6">
        <ArticleForm
          categories={categories}
          canManagePrices={canManagePrices}
          canViewCost={canViewCost}
        />
      </TabsContent>
    </Tabs>
  );
}
