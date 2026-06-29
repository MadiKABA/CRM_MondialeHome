"use client";

import { useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { forceRefreshDashboard } from "../server/actions";
import type { Period } from "../types";

interface Props {
  period: Period;
}

export function RefreshButton({ period }: Props) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await forceRefreshDashboard(period);
      if (result.success) {
        toast.success("Dashboard actualisé", {
          description: "Toutes les données sont à jour",
        });
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="border-cream-darker hover:bg-cream gap-2 text-xs"
    >
      {isRefreshing ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <RefreshCw className="size-3.5" />
      )}
      Actualiser
    </Button>
  );
}
