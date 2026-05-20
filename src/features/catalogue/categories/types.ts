export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  icon: string | null;
  parentId: string | null;
  parentName: string | null;
  isActive: boolean;
  sortOrder: number;
  articleCount: number;
  childrenCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTreeNode extends CategoryDTO {
  children: CategoryTreeNode[];
  depth: number;
  path: string[];
}

export interface CategorySelectOption {
  id: string;
  name: string;
  slug: string;
  depth: number;
  parentId: string | null;
  isActive: boolean;
  displayName: string;
}
