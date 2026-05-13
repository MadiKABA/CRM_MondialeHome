"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "./app-breadcrumbs";
import { WelcomeMessage } from "./header/welcome-message";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getFirstName } from "@/lib/utils/greeting";

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const firstName = getFirstName(session?.user.name);

  return (
    <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur-sm">
      {/* Ligne principale */}
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" className="h-5" />

        {/* Message de bienvenue */}
        <WelcomeMessage />

        {/* Actions à droite */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative size-9 p-0"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
            {/* Badge non lues (statique pour l'instant, à brancher sur les données) */}
            <span className="bg-primary absolute top-1.5 right-1.5 size-1.5 rounded-full" />
          </Button>

          {/* Toggle dark/light — masqué sur mobile (accessible via dropdown user) */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden size-9 p-0 sm:flex"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={
              theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"
            }
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {/* Avatar + dropdown utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative size-9 rounded-full p-0"
                  aria-label={`Menu de ${firstName || "l'utilisateur"}`}
                />
              }
            >
              <Avatar className="size-8">
                <AvatarImage src={session?.user.image ?? undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {session?.user.name?.slice(0, 2).toUpperCase() ?? "??"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="truncate text-sm font-medium">{session?.user.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {session?.user.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/settings/profile" />}>
                <User className="size-4" />
                Mon profil
              </DropdownMenuItem>
              {/* Toggle dark mode dans le dropdown sur mobile */}
              <DropdownMenuItem
                className="sm:hidden"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
                {theme === "dark" ? "Mode clair" : "Mode sombre"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} data-variant="destructive">
                <LogOut className="size-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Ligne breadcrumbs */}
      <div className="border-border/50 flex items-center border-t px-4 py-2 sm:px-6">
        <AppBreadcrumbs />
      </div>
    </header>
  );
}
