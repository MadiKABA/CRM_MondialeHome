import { NextResponse } from "next/server";
import { testRedisConnection } from "@/lib/redis";

export async function GET() {
  const redisOk = await testRedisConnection();

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      redis: redisOk ? "connected" : "unavailable",
    },
  });
}
