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

export const NAV_ITEMS = [
  {
    title: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    permission: null,
  },
  {
    title: "Clients",
    href: "/clients",
    icon: Users,
    permission: "clients.read",
  },
  {
    title: "Articles",
    href: "/articles",
    icon: Package,
    permission: "articles.read",
  },
  {
    title: "Ventes",
    href: "/sales",
    icon: ShoppingCart,
    permission: "sales.read",
  },
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
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    permission: "analytics.read",
  },
] as const;

export const NAV_BOTTOM_ITEMS = [
  {
    title: "Paramètres",
    href: "/settings",
    icon: Settings,
    permission: null,
  },
  {
    title: "Administration",
    href: "/admin",
    icon: Shield,
    permission: "admin.read",
  },
] as const;
