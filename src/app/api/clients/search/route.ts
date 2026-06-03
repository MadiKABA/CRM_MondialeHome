import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/permissions/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json([], { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "8"), 20);

  if (q.length < 2) return NextResponse.json([]);

  const clients = await db.client.findMany({
    where: {
      deletedAt: null,
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { fullName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { reference: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, fullName: true, phone: true, reference: true },
    take: limit,
    orderBy: { fullName: "asc" },
  });

  return NextResponse.json(clients);
}
