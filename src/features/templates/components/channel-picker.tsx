import Link from "next/link";
import { Mail, MessageSquare } from "lucide-react";

export function ChannelPicker() {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <h1 className="text-text-primary mb-1 text-center font-serif text-xl font-bold">
        Nouveau template
      </h1>
      <p className="text-text-secondary mb-8 text-center text-sm">
        Choisissez le canal du template
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/templates/nouveau?channel=email"
          className="border-cream-darker hover:border-gold hover:bg-cream/40 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-white p-8 text-center transition-colors"
        >
          <Mail className="text-gold-deep size-8" />
          <span className="text-text-primary font-semibold">Email</span>
          <span className="text-text-muted text-xs">
            Objet, bannière, articles, mise en page complète
          </span>
        </Link>
        <Link
          href="/templates/nouveau?channel=sms"
          className="border-cream-darker hover:border-gold hover:bg-cream/40 flex flex-col items-center gap-3 rounded-xl border-2 border-dashed bg-white p-8 text-center transition-colors"
        >
          <MessageSquare className="text-gold-deep size-8" />
          <span className="text-text-primary font-semibold">SMS</span>
          <span className="text-text-muted text-xs">
            Message court, 160 caractères, coût par SMS
          </span>
        </Link>
      </div>
    </div>
  );
}
