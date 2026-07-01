import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getServerSession, hasPermission } from "@/lib/permissions/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Upload local temporaire pour les tests — à migrer vers Cloudinary avant la prod
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

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
    return NextResponse.json(
      { error: "Trop de requêtes. Attendez une minute." },
      { status: 429 }
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

    const uploadDir = join(process.cwd(), "public", "uploads", "banners");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext = ALLOWED_EXTENSIONS[file.type];
    const filename = `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // URL absolue requise : previewTemplateSchema/sendTestEmailSchema valident
    // bannerImageUrl avec z.string().url(), et un vrai email a besoin d'une
    // URL publique complète (pas d'un chemin relatif)
    const url = new URL(
      `/uploads/banners/${filename}`,
      request.nextUrl.origin
    ).toString();
    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    logger.error({ error }, "uploadBanner failed");
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
