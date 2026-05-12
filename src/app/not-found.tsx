import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="font-heading text-primary/20 text-8xl font-bold">404</p>
      <h1 className="font-heading text-2xl font-bold">Page introuvable</h1>
      <p className="text-muted-foreground max-w-md">
        La page que vous cherchez n&apos;existe pas ou a été déplacée.
      </p>
      <Button variant="outline" render={<Link href="/dashboard" />}>
        <ArrowLeft className="mr-2 size-4" />
        Retour au tableau de bord
      </Button>
    </div>
  );
}
