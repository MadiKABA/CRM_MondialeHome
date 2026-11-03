// Reprise des avatars stockés sur le disque (/uploads/avatars/...) vers Cloudinary.
// Simulation par défaut ; ajouter --apply pour modifier la base.
//   pnpm uploads:migrate           (simulation)
//   pnpm uploads:migrate --apply
import { readFile } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/lib/db";

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
  secure: true,
});

const apply = process.argv.includes("--apply");

async function main() {
  const users = await db.user.findMany({
    where: { image: { startsWith: "/uploads/" } },
    select: { id: true, email: true, image: true },
  });
  console.log(
    `${users.length} avatar(s) local(aux) trouvé(s)${apply ? "" : " [simulation]"}`
  );

  let migrated = 0;
  let missing = 0;
  let failed = 0;

  for (const user of users) {
    const file = path.join(process.cwd(), "public", user.image!);
    let buffer: Buffer | null = null;
    try {
      buffer = await readFile(file);
    } catch {
      buffer = null;
    }

    if (!buffer) {
      missing++;
      console.log(`- ${user.email} : fichier absent → image remise à null`);
      if (apply) await db.user.update({ where: { id: user.id }, data: { image: null } });
      continue;
    }

    console.log(`- ${user.email} : fichier présent → envoi Cloudinary`);
    if (!apply) continue;
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "mondial-home/avatars",
            tags: ["avatar", "mondial-home"],
            resource_type: "image",
          },
          (err, res) => (err || !res ? reject(err) : resolve(res.secure_url))
        );
        stream.end(buffer);
      });
      await db.user.update({ where: { id: user.id }, data: { image: url } });
      migrated++;
    } catch (err) {
      failed++;
      console.error(
        `  échec pour ${user.email}`,
        err instanceof Error ? err.message : err
      );
    }
  }
  console.log(`Migrés : ${migrated} · absents : ${missing} · échecs : ${failed}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
