import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="bg-primary text-primary-foreground font-heading mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold shadow-lg">
        MH
      </div>
      <h1 className="font-heading text-foreground text-4xl font-bold tracking-tight">
        Mondiale Home CRM
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-lg">
        Plateforme de gestion clients, campagnes et ventes pour Mondiale Home Dakar.
      </p>
      <div className="mt-8 flex gap-4">
        <Button size="lg" render={<Link href="/login" />}>
          Accéder au CRM
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </div>
      <p className="text-muted-foreground mt-12 text-xs">
        © {new Date().getFullYear()} Mondiale Home — Tous droits réservés
      </p>
    </div>
  );
}
