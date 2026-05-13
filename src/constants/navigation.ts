import {
  LayoutDashboard,
  Users,
  Package,
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
      { title: "Clients", href: "/clients", icon: Users, permission: "clients.read" },
      {
        title: "Articles",
        href: "/articles",
        icon: Package,
        permission: "articles.read",
      },
      { title: "Ventes", href: "/sales", icon: ShoppingCart, permission: "sales.read" },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        title: "Campagnes",
        href: "/campaigns",
        icon: Megaphone,
        permission: "campaigns.read",
      },
      {
        title: "Segments",
        href: "/segments",
        icon: GitBranch,
        permission: "segments.read",
      },
      {
        title: "Automatisations",
        href: "/automations",
        icon: Zap,
        permission: "automations.read",
      },
      {
        title: "Templates",
        href: "/templates",
        icon: FileText,
        permission: "templates.read",
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
        permission: "analytics.read",
      },
    ],
  },
];

export const NAV_BOTTOM_ITEMS: NavItem[] = [
  { title: "Paramètres", href: "/settings", icon: Settings, permission: null },
  { title: "Administration", href: "/admin", icon: Shield, permission: "admin.read" },
];

// Rétrocompatibilité — liste plate pour les cas qui en ont besoin
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);
