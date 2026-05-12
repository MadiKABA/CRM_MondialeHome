"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  clients: "Clients",
  articles: "Articles",
  sales: "Ventes",
  campaigns: "Campagnes",
  segments: "Segments",
  automations: "Automatisations",
  templates: "Templates",
  analytics: "Analytics",
  settings: "Paramètres",
  admin: "Administration",
  new: "Nouveau",
  edit: "Modifier",
  profile: "Profil",
  users: "Utilisateurs",
  roles: "Rôles",
  audit: "Journal d'audit",
};

function getLabel(segment: string) {
  return SEGMENT_LABELS[segment] ?? segment;
}

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label = getLabel(segment);

          return (
            <Fragment key={href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={href} />}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
