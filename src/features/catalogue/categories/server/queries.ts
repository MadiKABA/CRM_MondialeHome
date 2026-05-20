import "server-only";

import { db } from "@/lib/db";
import type { CategoryDTO, CategoryTreeNode, CategorySelectOption } from "../types";

function toCategoryDTO(cat: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  parent: { name: string } | null;
  _count: { articles: number; children: number };
}): CategoryDTO {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    image: cat.image,
    icon: cat.icon,
    parentId: cat.parentId,
    parentName: cat.parent?.name ?? null,
    isActive: cat.isActive,
    sortOrder: cat.sortOrder,
    articleCount: cat._count.articles,
    childrenCount: cat._count.children,
    createdAt: cat.createdAt,
    updatedAt: cat.updatedAt,
  };
}

export async function getAllCategories(): Promise<CategoryDTO[]> {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      parent: { select: { name: true } },
      _count: { select: { articles: true, children: true } },
    },
  });
  return categories.map(toCategoryDTO);
}

export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const all = await getAllCategories();

  function buildTree(
    categories: CategoryDTO[],
    parentId: string | null,
    depth: number,
    path: string[]
  ): CategoryTreeNode[] {
    return categories
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fr"))
      .map((cat) => ({
        ...cat,
        depth,
        path: [...path, cat.id],
        children: buildTree(categories, cat.id, depth + 1, [...path, cat.id]),
      }));
  }

  return buildTree(all, null, 0, []);
}

export async function getCategoryById(id: string): Promise<CategoryDTO | null> {
  const cat = await db.category.findUnique({
    where: { id },
    include: {
      parent: { select: { name: true } },
      _count: { select: { articles: true, children: true } },
    },
  });
  if (!cat) return null;
  return toCategoryDTO(cat);
}

export async function getCategoriesForSelect(): Promise<CategorySelectOption[]> {
  const tree = await getCategoryTree();
  const options: CategorySelectOption[] = [];

  function flatten(nodes: CategoryTreeNode[]) {
    for (const node of nodes) {
      const prefix = "— ".repeat(node.depth);
      options.push({
        id: node.id,
        name: node.name,
        slug: node.slug,
        depth: node.depth,
        parentId: node.parentId,
        isActive: node.isActive,
        displayName: `${prefix}${node.name}`,
      });
      if (node.children.length > 0) flatten(node.children);
    }
  }

  flatten(tree);
  return options;
}

export async function wouldCreateCycle(
  categoryId: string,
  newParentId: string
): Promise<boolean> {
  if (categoryId === newParentId) return true;

  let current = await db.category.findUnique({
    where: { id: newParentId },
    select: { parentId: true },
  });

  while (current?.parentId) {
    if (current.parentId === categoryId) return true;
    current = await db.category.findUnique({
      where: { id: current.parentId },
      select: { parentId: true },
    });
  }

  return false;
}

export async function getCategoryStats() {
  const [total, active, withArticles, rootCount] = await Promise.all([
    db.category.count(),
    db.category.count({ where: { isActive: true } }),
    db.category.count({ where: { articles: { some: {} } } }),
    db.category.count({ where: { parentId: null } }),
  ]);
  return { total, active, withArticles, rootCount };
}
