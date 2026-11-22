import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/server/catalog";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { rows, mode } = loadCatalog();
  const r = rows.find((x) => x.id === id);
  if (!r) return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  return NextResponse.json({ ...r, source: mode });
}
