/**
 * Retourne le salut adapté à l'heure de la journée (timezone Dakar = UTC+0).
 * Dakar est en UTC+0 toute l'année (pas de changement d'heure).
 */
export function getGreeting(): string {
  const hour = new Date().getUTCHours(); // UTC+0 = heure de Dakar

  if (hour >= 5 && hour < 12) return "Bonjour";
  if (hour >= 12 && hour < 18) return "Bon après-midi";
  if (hour >= 18 && hour < 22) return "Bonsoir";
  return "Bonne nuit";
}

/**
 * Formate la date du jour en français.
 * Ex : "Mardi 12 mai 2026"
 */
export function formatTodayFr(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Dakar",
  }).format(new Date());
}

/**
 * Retourne le prénom (première partie du nom complet).
 */
export function getFirstName(fullName: string | undefined | null): string {
  if (!fullName) return "";
  return fullName.split(" ")[0] ?? fullName;
}
