"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppBreadcrumbs } from "./app-breadcrumbs";
import { CommandPalette } from "./command-palette";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";

export function AppHeader() {
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <>
      <header className="border-border bg-background/95 supports-[backdrop-filter]:bg-background/60 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <AppBreadcrumbs />

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hidden h-8 w-48 justify-between gap-2 md:flex"
            onClick={() => setCommandOpen(true)}
          >
            <span className="flex items-center gap-2">
              <Search className="size-3.5" />
              <span className="text-xs">Recherche...</span>
            </span>
            <kbd className="border-border bg-muted pointer-events-none hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
      </header>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
