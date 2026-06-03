"use client";

import { useState, useCallback } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, X, UserPlus, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientOption {
  id: string;
  fullName: string;
  phone: string | null;
  reference: string | null;
}

interface ClientSelectorProps {
  value: ClientOption | null;
  onChange: (client: ClientOption | null) => void;
  onQuickCreate: () => void;
  disabled?: boolean;
}

async function searchClients(query: string): Promise<ClientOption[]> {
  const params = new URLSearchParams({ q: query, limit: "8" });
  const res = await fetch(`/api/clients/search?${params}`);
  if (!res.ok) return [];
  return res.json() as Promise<ClientOption[]>;
}

export function ClientSelector({
  value,
  onChange,
  onQuickCreate,
  disabled,
}: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const data = await searchClients(q);
    setResults(data);
    setLoading(false);
  }, []);

  useDebounce(
    () => {
      void search(query);
    },
    300,
    [query]
  );

  function select(client: ClientOption) {
    onChange(client);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function clear() {
    onChange(null);
  }

  if (value) {
    return (
      <div className="border-border bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {value.fullName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{value.fullName}</p>
          {value.phone && (
            <p className="text-muted-foreground truncate text-xs">{value.phone}</p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={clear}
          disabled={disabled}
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="text-muted-foreground flex-1 justify-start gap-2 font-normal"
              disabled={disabled}
            />
          }
        >
          <Search className="size-4 shrink-0" />
          Rechercher un client...
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="start">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-2.5 left-3 size-4" />
              <Input
                placeholder="Nom, téléphone, référence..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <p className="text-muted-foreground p-4 text-center text-sm">
                Recherche...
              </p>
            )}
            {!loading && query.length < 2 && (
              <p className="text-muted-foreground p-4 text-center text-sm">
                Tapez au moins 2 caractères
              </p>
            )}
            {!loading && query.length >= 2 && results.length === 0 && (
              <p className="text-muted-foreground p-4 text-center text-sm">
                Aucun client trouvé
              </p>
            )}
            {results.map((client) => (
              <button
                key={client.id}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                  "hover:bg-accent focus:bg-accent focus:outline-none"
                )}
                onClick={() => select(client)}
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {client.fullName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{client.fullName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {client.phone ?? client.reference ?? "—"}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => {
                setOpen(false);
                onQuickCreate();
              }}
            >
              <UserPlus className="size-4" />
              Créer un nouveau client
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground w-full justify-start gap-2"
              onClick={() => {
                onChange({
                  id: "",
                  fullName: "Vente anonyme",
                  phone: null,
                  reference: null,
                });
                setOpen(false);
              }}
            >
              <User className="size-4" />
              Vente anonyme (sans client)
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onQuickCreate}
        disabled={disabled}
        title="Créer un client rapidement"
      >
        <UserPlus className="size-4" />
      </Button>
    </div>
  );
}
