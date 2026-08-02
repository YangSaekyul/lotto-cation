import { NextResponse } from "next/server";

async function triggerRefresh(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = process.env.GITHUB_DATA_REFRESH_TOKEN;
  if (!token) return NextResponse.json({ error: "Refresh integration is not configured." }, { status: 503 });

  const response = await fetch("https://api.github.com/repos/YangSaekyul/lotto-cation/dispatches", {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ event_type: "refresh-lotto-data" }),
    cache: "no-store",
  });
  if (!response.ok) {
    return NextResponse.json({ error: "Failed to trigger the data refresh." }, { status: 502 });
  }
  return NextResponse.json({ status: "accepted" }, { status: 202 });
}

export async function GET(request: Request) {
  return triggerRefresh(request);
}

export async function POST(request: Request) {
  return triggerRefresh(request);
}
