// Upload vers Cloudinary — appelé uniquement au moment du submit, jamais à la sélection
const CLOUD_NAME = process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"];
const UPLOAD_PRESET = process.env["NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET"];
const FOLDER = "mondial-home/articles";

export async function uploadArticleImage(file: File): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Variables Cloudinary manquantes. " +
        "Vérifiez NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME et " +
        "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET dans .env.local"
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", FOLDER);

  let response: Response;

  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        `Impossible de joindre Cloudinary. ` +
          `Vérifiez : 1) votre connexion internet, ` +
          `2) que NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="${CLOUD_NAME}" est correct, ` +
          `3) que le preset "${UPLOAD_PRESET}" est en mode Unsigned ` +
          `sur console.cloudinary.com → Settings → Upload Presets.`
      );
    }
    throw err;
  }

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: { message: string } };
      if (body.error?.message) {
        detail = body.error.message;
        if (detail.toLowerCase().includes("preset")) {
          detail +=
            " — Vérifiez que le preset est bien en mode Unsigned " +
            "sur console.cloudinary.com";
        }
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(`Upload Cloudinary échoué : ${detail}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const url = typeof data["secure_url"] === "string" ? data["secure_url"] : null;

  if (!url) {
    throw new Error("Cloudinary n'a pas retourné d'URL. Réessayez.");
  }

  if (!url.includes("res.cloudinary.com")) {
    throw new Error("URL Cloudinary suspecte. Upload annulé.");
  }

  return url;
}
