"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Shield, ClipboardList, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Membres",
    href: "/admin/users",
    icon: Users,
    description: "Gérer les comptes",
  },
  {
    label: "Profils d'accès",
    href: "/admin/roles",
    icon: Shield,
    description: "Configurer les droits",
  },
  {
    label: "Historique",
    href: "/admin/audit",
    icon: ClipboardList,
    description: "Actions effectuées",
  },
  {
    label: "Connexions",
    href: "/admin/sessions",
    icon: MonitorSmartphone,
    description: "Sessions actives",
  },
];

export function AdminSubnav() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav className="border-cream-darker bg-cream/50 border-b">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex gap-1 overflow-x-auto py-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-max items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-gold-deep text-cream shadow-sm"
                    : "text-text-secondary hover:bg-cream hover:text-text-primary"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
