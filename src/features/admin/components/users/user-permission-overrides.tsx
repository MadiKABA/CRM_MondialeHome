import { db } from "@/lib/db";
import { getPermissionLabel } from "@/features/admin/lib/permission-labels";

/**
 * Surcharges individuelles (ajout ou retrait explicite) actives pour un utilisateur.
 * Elles priment sur les droits du profil d'accès.
 */
export async function UserPermissionOverrides({ userId }: { userId: string }) {
  const overrides = await db.userPermission.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      granted: true,
      reason: true,
      expiresAt: true,
      permission: { select: { code: true } },
    },
    orderBy: { permission: { code: "asc" } },
  });

  if (overrides.length === 0) return null;

  return (
    <div className="border-cream-darker rounded-xl border p-6">
      <h3 className="text-text-primary font-semibold">Droits personnalisés</h3>
      <p className="text-text-secondary mt-0.5 mb-4 text-xs">
        Ces réglages individuels priment sur le profil d&apos;accès de la personne.
      </p>
      <ul className="space-y-2">
        {overrides.map((o) => (
          <li
            key={o.permission.code}
            className="border-cream-darker flex flex-col gap-0.5 rounded-lg border p-3 text-sm"
          >
            <span className="text-text-primary">
              <span
                className={
                  o.granted ? "font-medium text-emerald-700" : "font-medium text-red-700"
                }
              >
                {o.granted ? "Droit ajouté" : "Droit retiré"}
              </span>{" "}
              : {getPermissionLabel(o.permission.code)}
            </span>
            {o.reason && (
              <span className="text-text-secondary text-xs">Motif : {o.reason}</span>
            )}
            {o.expiresAt && (
              <span className="text-text-secondary text-xs">
                Jusqu&apos;au {o.expiresAt.toLocaleDateString("fr-FR")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
