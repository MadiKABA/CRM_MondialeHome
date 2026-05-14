import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { Monitor, Smartphone, Globe } from "lucide-react";
import { requireAuth, checkPermission } from "@/lib/permissions";
import { getAllActiveSessions } from "@/features/admin/server/queries/sessions.queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata = { title: "Connexions actives — Administration" };

interface Props {
  searchParams: Promise<{ page?: string }>;
}

function detectDevice(userAgent: string | null) {
  if (!userAgent) return { label: "Inconnu", Icon: Globe };
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
    return { label: "Mobile", Icon: Smartphone };
  }
  return { label: "Ordinateur", Icon: Monitor };
}

function detectBrowser(userAgent: string | null): string {
  if (!userAgent) return "";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Navigateur";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function SessionsPage({ searchParams }: Props) {
  await requireAuth();
  await checkPermission("admin.sessions.manage.all");

  const params = await searchParams;
  const page = Number(params.page ?? 1);
  const pageSize = 30;

  const { data: sessions, total } = await getAllActiveSessions(page, pageSize);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-text-primary font-heading text-2xl font-bold">
          Connexions actives
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          {total} session{total > 1 ? "s" : ""} active{total > 1 ? "s" : ""} en ce moment
        </p>
      </div>

      {/* Table */}
      {sessions.length === 0 ? (
        <div className="border-cream-darker rounded-xl border py-16 text-center">
          <p className="text-text-secondary text-sm">Aucune session active.</p>
        </div>
      ) : (
        <div className="border-cream-darker overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream/40 border-cream-darker border-b">
                <th className="text-text-secondary px-4 py-3 text-left font-medium">
                  Membre
                </th>
                <th className="text-text-secondary px-4 py-3 text-left font-medium">
                  Appareil
                </th>
                <th className="text-text-secondary px-4 py-3 text-left font-medium">
                  Adresse IP
                </th>
                <th className="text-text-secondary px-4 py-3 text-left font-medium">
                  Depuis
                </th>
                <th className="text-text-secondary px-4 py-3 text-left font-medium">
                  Expire dans
                </th>
              </tr>
            </thead>
            <tbody className="divide-cream-darker divide-y">
              {sessions.map((session) => {
                const { label: deviceLabel, Icon: DeviceIcon } = detectDevice(
                  session.userAgent
                );
                const browser = detectBrowser(session.userAgent);

                return (
                  <tr key={session.id} className="hover:bg-cream/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="border-cream-darker size-7 border">
                          <AvatarImage
                            src={session.userImage ?? undefined}
                            alt={session.userName}
                          />
                          <AvatarFallback className="bg-gold-light text-gold-deep text-[10px] font-bold">
                            {getInitials(session.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Link
                            href={`/admin/users/${session.userId}`}
                            className="text-text-primary hover:text-gold-deep text-xs font-medium transition-colors"
                          >
                            {session.userName}
                          </Link>
                          <p className="text-text-secondary text-[10px]">
                            {session.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-text-secondary px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs">
                        <DeviceIcon className="size-3.5 shrink-0" />
                        {deviceLabel}
                        {browser && <span className="opacity-70">— {browser}</span>}
                      </span>
                    </td>
                    <td className="text-text-secondary px-4 py-3 font-mono text-xs">
                      {session.ipAddress ?? "—"}
                    </td>
                    <td className="text-text-secondary px-4 py-3 text-xs">
                      {formatDistanceToNow(session.createdAt, {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </td>
                    <td className="text-text-secondary px-4 py-3 text-xs">
                      {formatDistanceToNow(session.expiresAt, {
                        addSuffix: false,
                        locale: fr,
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/admin/sessions?page=${page - 1}`}
              className="border-cream-darker text-text-secondary hover:bg-cream rounded-lg border px-3 py-1.5 text-sm transition-colors"
            >
              Précédent
            </Link>
          )}
          <span className="text-text-secondary text-sm">
            Page {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/sessions?page=${page + 1}`}
              className="border-cream-darker text-text-secondary hover:bg-cream rounded-lg border px-3 py-1.5 text-sm transition-colors"
            >
              Suivant
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
