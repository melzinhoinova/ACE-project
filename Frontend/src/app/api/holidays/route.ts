import { NextRequest, NextResponse } from "next/server";
import { getHolidays } from "@/lib/holidays";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const anoParam = searchParams.get("ano");
  const uf = searchParams.get("uf") ?? undefined;
  const city = searchParams.get("city") ?? undefined;

  const ano = anoParam ? parseInt(anoParam, 10) : new Date().getFullYear();

  try {
    const result = await getHolidays({ ano, uf, city });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { holidays: [], error: (err as Error).message ?? "Erro desconhecido" },
      { status: 200 },
    );
  }
}
