"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV_BOTTOM_ITEMS, NAV_ITEMS } from "@/constants/navigation";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher une page, un client, une commande..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => runCommand(item.href)}
              value={item.title}
            >
              <item.icon className="mr-2 size-4" />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Paramètres">
          {NAV_BOTTOM_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => runCommand(item.href)}
              value={item.title}
            >
              <item.icon className="mr-2 size-4" />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
