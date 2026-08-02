import { NextResponse } from "next/server";
import { getStoreById } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStoreById(id);

  if (!store) {
    return NextResponse.json(
      { error: "Store not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ store });
}
