import { Prisma, type Article } from "@prisma/client";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

// Générateur UNIQUE de références article (création rapide et complète).
// - Prend le plus grand numéro des références au format MH-<chiffres>, y compris
//   les articles supprimés (la contrainte @unique porte sur toute la table).
// - Ignore les références d'un autre format (MH-COU-001...), jamais triées en texte.
// - Verrou consultatif transactionnel : deux créations simultanées sont sérialisées.
// - En cas de conflit résiduel : 3 essais avec attente croissante.

const LOCK_KEY = 7_203_001;
const MAX_ATTEMPTS = 3;

export class ArticleCreateError extends Error {
  constructor(
    readonly kind: "reference" | "barcode",
    message: string
  ) {
    super(message);
  }
}

type ArticleCreateData = Omit<Prisma.ArticleUncheckedCreateInput, "reference">;

function formatReference(n: number): string {
  return `MH-${String(n).padStart(5, "0")}`;
}

async function nextReference(tx: Prisma.TransactionClient): Promise<string> {
  const rows = await tx.$queryRaw<{ max: bigint | null }[]>`
    SELECT MAX(CAST(SUBSTRING("reference" FROM 4) AS BIGINT)) AS max
    FROM "articles"
    WHERE "reference" ~ '^MH-[0-9]{1,15}$'`;
  return formatReference(Number(rows[0]?.max ?? 0) + 1);
}

function uniqueTarget(err: unknown): string[] | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const target = err.meta?.["target"];
    return Array.isArray(target) ? (target as string[]) : [String(target ?? "")];
  }
  return null;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function createArticleWithAutoReference(
  data: ArticleCreateData
): Promise<Article> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT 1 AS ok FROM (SELECT pg_advisory_xact_lock(${LOCK_KEY}::bigint)) AS l`;
        const reference = await nextReference(tx);
        return tx.article.create({ data: { ...data, reference } });
      });
    } catch (err) {
      const target = uniqueTarget(err);
      if (!target) throw err;
      if (target.some((t) => t.includes("barcode"))) {
        throw new ArticleCreateError("barcode", "Ce code-barres existe déjà");
      }
      logger.warn({ err, attempt }, "Article reference conflict, retrying");
      if (attempt === MAX_ATTEMPTS) {
        throw new ArticleCreateError("reference", "Conflit de référence");
      }
      await sleep(50 * 2 ** attempt);
    }
  }
  throw new ArticleCreateError("reference", "Conflit de référence");
}
