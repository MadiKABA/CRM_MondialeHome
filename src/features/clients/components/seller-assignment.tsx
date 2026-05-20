"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserCheck, UserX, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { assignClientToUser } from "../server/actions";
import type { SellerDTO } from "../types";

interface SellerAssignmentProps {
  clientId: string;
  currentSeller: SellerDTO | null;
  sellers: SellerDTO[];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SellerAssignment({
  clientId,
  currentSeller,
  sellers,
}: SellerAssignmentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const assign = (sellerId: string | null) => {
    setOpen(false);
    startTransition(async () => {
      const result = await assignClientToUser({
        clientId,
        assignedToId: sellerId,
      });
      if (result.success) {
        toast.success(sellerId ? "Vendeur assigné" : "Assignation retirée");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {currentSeller ? (
          <>
            <Avatar className="size-8">
              <AvatarImage src={currentSeller.image ?? undefined} />
              <AvatarFallback className="bg-gold-light text-gold-darker text-xs font-semibold">
                {initials(currentSeller.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{currentSeller.name}</p>
              <p className="text-text-secondary text-xs">Vendeur assigné</p>
            </div>
          </>
        ) : (
          <>
            <div className="bg-muted text-text-secondary flex size-8 items-center justify-center rounded-full">
              <UserX className="size-4" />
            </div>
            <p className="text-text-secondary text-sm">Aucun vendeur assigné</p>
          </>
        )}
      </div>

      {sellers.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="border-cream-darker hover:bg-cream"
                disabled={isPending}
              />
            }
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <UserCheck className="size-3.5" />
                Changer
                <ChevronDown className="size-3" />
              </>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            <Command>
              <CommandInput placeholder="Rechercher un vendeur…" />
              <CommandList>
                <CommandEmpty>Aucun vendeur trouvé.</CommandEmpty>
                <CommandGroup>
                  {sellers.map((seller) => (
                    <CommandItem
                      key={seller.id}
                      value={seller.name}
                      onSelect={() => assign(seller.id)}
                      className="cursor-pointer"
                    >
                      <Avatar className="mr-2 size-6">
                        <AvatarImage src={seller.image ?? undefined} />
                        <AvatarFallback className="bg-gold-light text-gold-darker text-xs">
                          {initials(seller.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{seller.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {currentSeller && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => assign(null)}
                        className="text-destructive cursor-pointer"
                      >
                        <UserX className="mr-2 size-4" />
                        Retirer l&apos;assignation
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
