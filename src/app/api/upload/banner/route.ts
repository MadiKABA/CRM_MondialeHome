import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getServerSession, hasPermission } from "@/lib/permissions/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { uploadImageBuffer } from "@/lib/cloudinary/upload";

// Envoi signé côté serveur vers Cloudinary (le disque du build est perdu à chaque déploiement)
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const allowed =
    (await hasPermission("templates.create.all")) ||
    (await hasPermission("templates.update.all")) ||
    (await hasPermission("campaigns.create.all")) ||
    (await hasPermission("campaigns.update.all"));
  if (!allowed) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }

  const rl = await checkRateLimit({
    key: `upload:banner:${session.user.id}`,
    ...RATE_LIMITS.UPLOAD_IMAGE,
  });
  if (!rl.allowed) {
    const retryAfter = rl.retryAfterSec ?? 60;
    return NextResponse.json(
      { error: `Trop d'envois. Réessayez dans ${retryAfter} s.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Type non autorisé. Formats acceptés : JPG, PNG, WEBP, GIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop lourd. Maximum 5 MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImageBuffer(buffer, "templates/banners", [
      "template-banner",
      "mondial-home",
    ]);
    const url = result.url;
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    logger.error({ err: error }, "uploadBanner failed");
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
