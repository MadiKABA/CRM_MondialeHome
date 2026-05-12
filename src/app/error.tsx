"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bg-destructive/10 text-destructive flex h-14 w-14 items-center justify-center rounded-full">
        <AlertTriangle className="size-7" />
      </div>
      <h1 className="font-heading text-2xl font-bold">Une erreur est survenue</h1>
      <p className="text-muted-foreground max-w-md">
        {error.message || "Une erreur inattendue s'est produite. Veuillez réessayer."}
      </p>
      {error.digest && (
        <p className="text-muted-foreground font-mono text-xs">Ref: {error.digest}</p>
      )}
      <Button onClick={reset}>Réessayer</Button>
    </div>
  );
}
