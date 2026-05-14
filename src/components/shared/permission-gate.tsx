import { usePermission } from "@/hooks/use-permission";
import type { PermissionCode } from "@/lib/permissions";
import type { ReactNode } from "react";

interface PermissionGateProps {
  permission: PermissionCode;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
}: PermissionGateProps) {
  const allowed = usePermission(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
