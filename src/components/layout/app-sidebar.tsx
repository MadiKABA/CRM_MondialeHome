"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NAV_GROUPS, NAV_BOTTOM_ITEMS } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import { ChevronUp, LogOut, User } from "lucide-react";
import { signOut, useSession } from "@/lib/auth/client";

interface AppSidebarProps {
  userPermissions?: string[];
  isSuperAdmin?: boolean;
}

export function AppSidebar({
  userPermissions = [],
  isSuperAdmin = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  function canSeeItem(permission: string | null): boolean {
    if (!permission) return true;
    if (isSuperAdmin) return true;
    return userPermissions.includes(permission) || userPermissions.includes("*");
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="shadow-md">
      {/* Header sidebar */}
      <SidebarHeader className="border-sidebar-border border-b">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-3",
            isCollapsed && "justify-center"
          )}
        >
          <div className="bg-primary text-primary-foreground font-heading flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
            MH
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-heading text-sidebar-foreground text-sm leading-tight font-semibold">
                Mondiale Home
              </span>
              <span className="text-sidebar-foreground/50 text-xs">CRM Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Navigation principale par groupes */}
      <SidebarContent className="gap-0">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => canSeeItem(item.permission));
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={group.label} className="py-2">
              <SidebarGroupLabel className="text-sidebar-foreground/40 px-3 text-[10px] font-semibold tracking-widest uppercase">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive(item.href)}
                        tooltip={item.title}
                        size="lg"
                        render={<Link href={item.href} />}
                        className={cn(
                          "gap-3 transition-all duration-200",
                          isActive(item.href) && "text-primary font-semibold"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "size-5 shrink-0",
                            isActive(item.href)
                              ? "text-primary"
                              : "text-sidebar-foreground/60"
                          )}
                        />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {/* Footer : paramètres + admin + user */}
      <SidebarFooter className="border-sidebar-border border-t pt-2">
        <SidebarMenu>
          {NAV_BOTTOM_ITEMS.filter((item) => canSeeItem(item.permission)).map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={isActive(item.href)}
                tooltip={item.title}
                size="lg"
                render={<Link href={item.href} />}
                className={cn(
                  "gap-3 transition-all duration-200",
                  isActive(item.href) && "text-primary font-semibold"
                )}
              >
                <item.icon
                  className={cn(
                    "size-5 shrink-0",
                    isActive(item.href) ? "text-primary" : "text-sidebar-foreground/60"
                  )}
                />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {/* User card */}
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    tooltip={session?.user.name ?? "Mon compte"}
                    className="gap-3 transition-all duration-200"
                  />
                }
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={session?.user.image ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-xs font-semibold">
                    {session?.user.name?.slice(0, 2).toUpperCase() ?? "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left text-sm leading-tight">
                  <span className="text-sidebar-foreground truncate font-medium">
                    {session?.user.name ?? "Utilisateur"}
                  </span>
                  <span className="text-sidebar-foreground/50 truncate text-xs">
                    {session?.user.email}
                  </span>
                </div>
                <ChevronUp className="text-sidebar-foreground/40 ml-auto size-4" />
              </DropdownMenuTrigger>

              <DropdownMenuContent side="top" className="w-56 min-w-56" align="start">
                <DropdownMenuItem render={<Link href="/settings/profile" />}>
                  <User className="size-4" />
                  Mon profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} data-variant="destructive">
                  <LogOut className="size-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
