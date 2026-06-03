import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/permissions/server";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json([], { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "8"), 20);

  if (q.length < 2) return NextResponse.json([]);

  const articles = await db.article.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { reference: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q } },
        { brand: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      reference: true,
      name: true,
      price: true,
      promoPrice: true,
      stock: true,
      mainImage: true,
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    articles.map((a) => ({
      id: a.id,
      reference: a.reference,
      name: a.name,
      price: Number(a.promoPrice ?? a.price),
      stock: a.stock,
      mainImage: a.mainImage,
    }))
  );
}
