// Rattrapage idempotent : s'assure que les permissions « segments.* » existent et sont
// attribuées aux profils admin et super_admin, sans toucher aux autres permissions.
// À lancer MANUELLEMENT, jamais au déploiement. Simulation par défaut :
//   pnpm rbac:grant-segments            (simulation, aucune écriture)
//   pnpm rbac:grant-segments --apply    (écrit + trace dans le journal d'audit)
// Une ligne role_permissions existante avec granted=false est signalée, jamais modifiée.
import { db } from "@/lib/db";

const apply = process.argv.includes("--apply");
const ROLE_SLUGS = ["admin", "super_admin"];

const SEGMENT_PERMISSIONS = [
  ["read", "Voir les segments et groupes"],
  ["create", "Créer des segments et groupes"],
  ["update", "Modifier les segments et groupes"],
  ["delete", "Supprimer des segments et groupes"],
  ["compute", "Recalculer les segments dynamiques"],
  ["manage_members", "Ajouter et retirer des membres des groupes"],
] as const;

async function main() {
  console.log(apply ? "MODE APPLY" : "MODE SIMULATION (ajoutez --apply pour écrire)");

  const roles = await db.role.findMany({ where: { slug: { in: ROLE_SLUGS } } });
  for (const slug of ROLE_SLUGS) {
    if (!roles.some((r) => r.slug === slug)) console.warn(`Profil introuvable : ${slug}`);
  }

  let createdPerms = 0;
  let createdLinks = 0;
  const blocked: string[] = [];

  for (const [action, description] of SEGMENT_PERMISSIONS) {
    const code = `segments.${action}.all`;
    let perm = await db.permission.findUnique({ where: { code } });
    if (!perm) {
      console.log(`+ permission manquante : ${code}`);
      createdPerms++;
      if (!apply) continue;
      perm = await db.permission.create({
        data: {
          code,
          module: "segments",
          action,
          scope: "all",
          description,
          category: "Segments",
        },
      });
    }

    for (const role of roles) {
      const link = await db.rolePermission.findUnique({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      });
      if (!link) {
        console.log(`+ ${role.slug} <- ${code}`);
        createdLinks++;
        if (apply) {
          await db.rolePermission.create({
            data: { roleId: role.id, permissionId: perm.id, granted: true },
          });
        }
      } else if (!link.granted) {
        blocked.push(`${role.slug} / ${code}`);
      }
    }
  }

  if (blocked.length > 0) {
    console.warn("Révoquées explicitement (granted=false), NON modifiées :");
    blocked.forEach((b) => console.warn(`  - ${b}`));
  }

  if (apply && (createdPerms > 0 || createdLinks > 0)) {
    await db.auditLog.create({
      data: {
        userId: null,
        action: "rbac.segments.grant_script",
        entity: "Role",
        newValue: { createdPerms, createdLinks, roles: ROLE_SLUGS },
        status: "success",
      },
    });
  }

  console.log(
    `Permissions créées : ${createdPerms} · Attributions créées : ${createdLinks}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
