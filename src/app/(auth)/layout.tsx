import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background min-h-screen lg:grid lg:grid-cols-2">
      {/* Colonne gauche — branding (desktop uniquement) */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        {/* Fond gradient terracotta → sable */}
        <div className="from-brand-terracotta via-brand-bark to-brand-sand absolute inset-0 bg-gradient-to-br" />
        {/* Texture overlay subtile */}
        <div className="absolute inset-0 bg-black/10" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <span className="font-heading text-sm font-bold text-white">MH</span>
          </div>
          <div>
            <p className="font-heading text-base font-semibold text-white">
              Mondiale Home
            </p>
            <p className="text-xs text-white/70">CRM Platform</p>
          </div>
        </div>

        {/* Accroche centrale */}
        <div className="relative z-10 space-y-4">
          <blockquote className="space-y-2">
            <p className="font-heading text-2xl leading-snug font-medium text-white xl:text-3xl">
              &ldquo;Votre espace maison,
              <br />
              au bout des doigts.&rdquo;
            </p>
            <p className="text-sm text-white/70">
              Gérez vos clients, vos collections et vos campagnes
              <br />
              depuis une seule plateforme.
            </p>
          </blockquote>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} Mondiale Home &mdash; Dakar, Sénégal
          </p>
        </div>
      </div>

      {/* Colonne droite — formulaire */}
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 sm:px-12">
        {/* Logo mobile (visible uniquement sur mobile/tablette) */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="bg-primary text-primary-foreground font-heading flex size-10 items-center justify-center rounded-xl text-sm font-bold">
            MH
          </div>
          <div>
            <p className="font-heading text-base leading-none font-semibold">
              Mondiale Home
            </p>
            <p className="text-muted-foreground text-xs">CRM Platform</p>
          </div>
        </div>

        {/* Contenu (page enfant) */}
        <div className="w-full max-w-sm">{children}</div>

        {/* Footer légal */}
        <p className="text-muted-foreground mt-12 text-center text-xs">
          &copy; {new Date().getFullYear()} Mondiale Home &bull;{" "}
          <a
            href="#"
            className="hover:text-foreground underline-offset-4 hover:underline"
          >
            Politique de confidentialité
          </a>
        </p>
      </div>
    </div>
  );
}
