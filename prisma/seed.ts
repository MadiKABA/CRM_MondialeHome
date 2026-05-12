import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // TODO: Ajouter les données initiales après réception du schéma complet :
  // - Super Admin user
  // - Rôles système (super_admin, admin, manager, agent, viewer)
  // - Permissions par rôle
  // - Catégories d'articles de base
  // - Templates de messages de démarrage

  console.log("✅ Seeding completed.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
