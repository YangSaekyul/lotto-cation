import { NextResponse } from "next/server";
import { getLatestDraw } from "@/lib/db";

export async function GET() {
  const drawResult = getLatestDraw();
  return NextResponse.json(drawResult);
}
