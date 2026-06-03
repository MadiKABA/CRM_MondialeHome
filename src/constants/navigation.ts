import {
  LayoutDashboard,
  Users,
  Package,
  Tag,
  ShoppingCart,
  Megaphone,
  GitBranch,
  Zap,
  FileText,
  BarChart3,
  Settings,
  Shield,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string | null;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Principal",
    items: [
      {
        title: "Tableau de bord",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: null,
      },
      { title: "Clients", href: "/clients", icon: Users, permission: "clients.read.all" },
      {
        title: "Ventes",
        href: "/sales",
        icon: ShoppingCart,
        permission: "sales.read.own",
      },
    ],
  },
  {
    label: "Catalogue",
    items: [
      {
        title: "Catégories",
        href: "/catalogue/categories",
        icon: Tag,
        permission: "articles.read.all",
      },
      {
        title: "Articles",
        href: "/catalogue/articles",
        icon: Package,
        permission: "articles.read.all",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        title: "Campagnes",
        href: "/campaigns",
        icon: Megaphone,
        permission: "campaigns.read.all",
      },
      {
        title: "Segments",
        href: "/segments",
        icon: GitBranch,
        permission: "segments.read.all",
      },
      {
        title: "Automatisations",
        href: "/automations",
        icon: Zap,
        permission: "automations.read.all",
      },
      {
        title: "Templates",
        href: "/templates",
        icon: FileText,
        permission: "templates.read.all",
      },
    ],
  },
  {
    label: "Pilotage",
    items: [
      {
        title: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        permission: "analytics.view.basic",
      },
    ],
  },
];

export const NAV_BOTTOM_ITEMS: NavItem[] = [
  { title: "Paramètres", href: "/settings", icon: Settings, permission: null },
  { title: "Administration", href: "/admin", icon: Shield, permission: "admin.view.all" },
];

// Rétrocompatibilité — liste plate pour les cas qui en ont besoin
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
