import { Suspense } from "react";
import { TreePine, LayoutList, Package2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getCategoryTree,
  getCategoriesForSelect,
  getCategoryStats,
} from "@/features/catalogue/categories/server/queries";
import { CategoryTree } from "@/features/catalogue/categories/components/category-tree";
import { CategoryTreeSkeleton } from "@/features/catalogue/categories/components/category-tree-skeleton";
import { AddCategoryButton } from "@/features/catalogue/categories/components/add-category-button";

export const metadata = { title: "Catégories — Mondiale Home CRM" };

async function StatsRow() {
  const stats = await getCategoryStats();
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: "Total", value: stats.total, icon: Package2 },
        { label: "Actives", value: stats.active, icon: TreePine },
        { label: "Racines", value: stats.rootCount, icon: LayoutList },
        { label: "Avec articles", value: stats.withArticles, icon: Package2 },
      ].map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="border-cream-darker bg-card flex items-center gap-3 rounded-xl border p-4"
        >
          <div className="bg-gold-light/30 flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Icon className="text-gold-deep size-4" />
          </div>
          <div>
            <p className="text-xl leading-none font-bold">{value}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

async function CategoriesContent() {
  const [tree, selectOptions] = await Promise.all([
    getCategoryTree(),
    getCategoriesForSelect(),
  ]);

  return <CategoryTree tree={tree} selectOptions={selectOptions} canManage />;
}

async function HeaderActions() {
  const selectOptions = await getCategoriesForSelect();
  return <AddCategoryButton selectOptions={selectOptions} />;
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Catégories</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Organisez votre catalogue en catégories et sous-catégories
          </p>
        </div>
        <Suspense fallback={<Skeleton className="h-9 w-40 rounded-lg" />}>
          <HeaderActions />
        </Suspense>
      </div>

      {/* Stats */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-xl" />
            ))}
          </div>
        }
      >
        <StatsRow />
      </Suspense>

      {/* Arbre */}
      <Suspense fallback={<CategoryTreeSkeleton />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
}
