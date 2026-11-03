// Normalisation des téléphones clients en E.164 (+ indicatif pays).
// À lancer MANUELLEMENT, jamais au déploiement. Simulation par défaut :
//   pnpm phones:migrate                    (simulation, aucune écriture)
//   pnpm phones:migrate --apply            (sauvegarde la table puis modifie)
//   pnpm phones:migrate --country=FR       (pays par défaut des numéros sans indicatif, SN par défaut)
// Les numéros non normalisables ou créant un doublon sont listés et NON modifiés.
import { db } from "@/lib/db";
import { DEFAULT_COUNTRY, parsePhone, type CountryCode } from "@/lib/phone";

const apply = process.argv.includes("--apply");
const countryArg = process.argv.find((a) => a.startsWith("--country="))?.split("=")[1];
const country = (countryArg?.toUpperCase() ?? DEFAULT_COUNTRY) as CountryCode;

type Field = "phone" | "phoneSecondary" | "whatsapp";

// Aucun numéro complet dans la sortie : on masque le milieu.
function mask(value: string): string {
  return value.length <= 5 ? "***" : `${value.slice(0, 3)}***${value.slice(-2)}`;
}

interface Change {
  id: string;
  reference: string;
  field: Field;
  before: string;
  after: string;
}
interface Issue {
  reference: string;
  field: Field;
  value: string;
  reason: string;
}

async function main() {
  const clients = await db.client.findMany({
    select: {
      id: true,
      reference: true,
      deletedAt: true,
      phone: true,
      phoneSecondary: true,
      whatsapp: true,
    },
  });
  console.log(
    `${clients.length} client(s) — pays par défaut : ${country} — ${apply ? "APPLICATION" : "SIMULATION"}`
  );

  // `phone` est unique en base (clients supprimés inclus) : on suit les valeurs finales.
  const takenPhones = new Map<string, string>(); // e164 -> client id
  const pending: Array<{ c: (typeof clients)[number]; e164: string }> = [];
  const changes: Change[] = [];
  const issues: Issue[] = [];

  // 1) Numéros principaux déjà conformes : réservés en premier
  for (const c of clients) {
    if (c.phone && parsePhone(c.phone, country).ok) {
      const r = parsePhone(c.phone, country);
      if (r.ok && r.e164 === c.phone) takenPhones.set(c.phone, c.id);
    }
  }

  // 2) Numéros principaux à modifier
  for (const c of clients) {
    if (!c.phone) continue;
    const r = parsePhone(c.phone, country);
    if (!r.ok) {
      issues.push({
        reference: c.reference ?? c.id,
        field: "phone",
        value: mask(c.phone),
        reason: "non normalisable",
      });
      continue;
    }
    if (r.e164 === c.phone) continue;
    const owner = takenPhones.get(r.e164);
    if (owner && owner !== c.id) {
      issues.push({
        reference: c.reference ?? c.id,
        field: "phone",
        value: mask(c.phone),
        reason: "doublon après normalisation",
      });
      continue;
    }
    takenPhones.set(r.e164, c.id);
    pending.push({ c, e164: r.e164 });
    changes.push({
      id: c.id,
      reference: c.reference ?? c.id,
      field: "phone",
      before: mask(c.phone),
      after: mask(r.e164),
    });
  }

  // 3) Champs non uniques : normalisation simple
  const secondary: Array<{ id: string; field: Field; e164: string }> = [];
  for (const c of clients) {
    for (const field of ["phoneSecondary", "whatsapp"] as const) {
      const value = c[field];
      if (!value) continue;
      const r = parsePhone(value, country);
      if (!r.ok) {
        issues.push({
          reference: c.reference ?? c.id,
          field,
          value: mask(value),
          reason: "non normalisable",
        });
      } else if (r.e164 !== value) {
        secondary.push({ id: c.id, field, e164: r.e164 });
        changes.push({
          id: c.id,
          reference: c.reference ?? c.id,
          field,
          before: mask(value),
          after: mask(r.e164),
        });
      }
    }
  }

  console.log(`\n── Modifications (${changes.length}) ──`);
  for (const ch of changes.slice(0, 200)) {
    console.log(`${ch.reference}  ${ch.field}: ${ch.before} → ${ch.after}`);
  }
  if (changes.length > 200) console.log(`… ${changes.length - 200} autres`);

  console.log(`\n── Non modifiés, à traiter à la main (${issues.length}) ──`);
  for (const i of issues)
    console.log(`${i.reference}  ${i.field}: ${i.value}  [${i.reason}]`);

  if (!apply) {
    console.log(
      "\nSimulation terminée — rien n'a été écrit. Relancer avec --apply pour appliquer."
    );
    return;
  }

  // Sauvegarde complète de la table avant toute écriture
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const backup = `clients_backup_${stamp}_${Date.now()}`;
  await db.$executeRawUnsafe(`CREATE TABLE "${backup}" AS SELECT * FROM clients`);
  console.log(`\nSauvegarde créée : table "${backup}"`);

  let done = 0;
  for (const { c, e164 } of pending) {
    await db.client.update({ where: { id: c.id }, data: { phone: e164 } });
    done++;
  }
  for (const s of secondary) {
    await db.client.update({ where: { id: s.id }, data: { [s.field]: s.e164 } });
    done++;
  }
  console.log(`${done} champ(s) mis à jour.`);
}

main()
  .catch((error) => {
    console.error(
      "Échec de la migration :",
      error instanceof Error ? error.message : error
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
