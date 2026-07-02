import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getServerSession, hasPermission } from "@/lib/permissions/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { uploadImageBuffer } from "@/lib/cloudinary/upload";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Sous-dossiers Cloudinary autorisés — jamais un nom de dossier fourni librement
// par le client, pour éviter toute injection dans le chemin de stockage.
const ALLOWED_FOLDERS = ["campaigns/banners", "campaigns/free-images"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const allowed =
    (await hasPermission("campaigns.create.all")) ||
    (await hasPermission("campaigns.update.all"));
  if (!allowed) {
    return NextResponse.json({ error: "Permission refusée" }, { status: 403 });
  }

  const rl = await checkRateLimit({
    key: `upload:campaign-image:${session.user.id}`,
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
    const folder = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
    }

    if (!ALLOWED_FOLDERS.includes(folder as AllowedFolder)) {
      return NextResponse.json({ error: "Dossier invalide" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non accepté. Utilisez JPG, PNG ou WEBP" },
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
    const result = await uploadImageBuffer(buffer, folder as AllowedFolder);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    logger.error({ error }, "uploadCampaignImage failed");
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
  }
}
