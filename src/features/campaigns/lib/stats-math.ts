// Calculs purs de statistiques — aucun import serveur (utilisable partout)

export interface StatusCounts {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
}

// Pourcentage arrondi à 1 décimale, 0 si le dénominateur est nul
export function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export function computeRates(c: StatusCounts) {
  return {
    deliveryRate: pct(c.delivered, c.sent),
    openRate: pct(c.opened, c.delivered),
    clickRate: pct(c.clicked, c.delivered),
    bounceRate: pct(c.bounced, c.sent),
  };
}

// Compte les statuts des logs vers les compteurs cumulatifs :
// un message CLICKED est aussi ouvert et délivré, etc.
export function countsFromStatuses(byStatus: Record<string, number>): StatusCounts {
  const n = (s: string) => byStatus[s] ?? 0;
  const clicked = n("CLICKED");
  const opened = n("OPENED") + clicked;
  const delivered = n("DELIVERED") + n("COMPLAINED") + opened;
  const bounced = n("BOUNCED");
  // Envoyé = accepté par Resend (tout statut postérieur à l'envoi)
  const sent = n("SENT") + delivered + bounced;
  return { sent, delivered, opened, clicked, bounced, failed: n("FAILED") };
}

// Aucun événement webhook reçu alors que des emails sont partis
export function isTrackingPending(c: StatusCounts): boolean {
  return c.sent > 0 && c.delivered + c.opened + c.clicked + c.bounced === 0;
}
