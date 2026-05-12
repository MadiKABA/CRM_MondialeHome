"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
import { NAV_BOTTOM_ITEMS, NAV_ITEMS } from "@/constants/navigation";
import { cn } from "@/lib/utils";
import { ChevronUp, LogOut, User } from "lucide-react";
import { signOut, useSession } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div
          className={cn(
            "flex items-center gap-3 px-2 py-4",
            isCollapsed && "justify-center"
          )}
        >
          <div className="bg-primary text-primary-foreground font-heading flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
            MH
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-heading text-sidebar-foreground text-sm font-semibold">
                Mondial Home
              </span>
              <span className="text-sidebar-foreground/60 text-xs">CRM</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {NAV_BOTTOM_ITEMS.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton tooltip={item.title} render={<Link href={item.href} />}>
                <item.icon className="size-4 shrink-0" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton size="lg" tooltip={session?.user.name ?? "Compte"} />
                }
              >
                <Avatar className="size-7 rounded-lg">
                  <AvatarImage src={session?.user.image ?? undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-xs">
                    {session?.user.name?.slice(0, 2).toUpperCase() ?? "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left text-sm leading-tight">
                  <span className="text-sidebar-foreground truncate font-medium">
                    {session?.user.name}
                  </span>
                  <span className="text-sidebar-foreground/60 truncate text-xs">
                    {session?.user.email}
                  </span>
                </div>
                <ChevronUp className="text-sidebar-foreground/60 ml-auto size-4" />
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
