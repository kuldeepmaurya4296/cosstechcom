import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import redisClient from "@/lib/redis";

export async function GET() {
  const healthInfo: any = {
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      mongodb: { status: "unknown" },
      redis: { status: "unknown" },
    },
  };

  let hasError = false;

  // 1. Check MongoDB
  try {
    await connectToDatabase();
    const mongoState = mongoose.connection.readyState;
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    if (mongoState === 1) {
      healthInfo.services.mongodb = {
        status: "healthy",
        connectionState: "connected",
      };
    } else {
      healthInfo.services.mongodb = {
        status: "unhealthy",
        connectionState: mongoState,
      };
      hasError = true;
    }
  } catch (err: any) {
    healthInfo.services.mongodb = {
      status: "unhealthy",
      error: err.message || "Connection error",
    };
    hasError = true;
  }

  // 2. Check Redis
  try {
    // Simple set/get test to verify Redis is operational
    const testKey = "health_check:ping";
    await redisClient.set(testKey, "OK", { ex: 5 });
    const result = await redisClient.get(testKey);
    if (result === "OK") {
      healthInfo.services.redis = {
        status: "healthy",
        type: redisClient.constructor.name === "InMemoryRedis" ? "InMemory" : "UpstashRedis",
      };
    } else {
      healthInfo.services.redis = {
        status: "unhealthy",
        error: "Redis read verification failed",
      };
      hasError = true;
    }
  } catch (err: any) {
    healthInfo.services.redis = {
      status: "unhealthy",
      error: err.message || "Connection error",
    };
    hasError = true;
  }

  if (hasError) {
    healthInfo.status = "DEGRADED";
    return NextResponse.json(healthInfo, { status: 500 });
  }

  return NextResponse.json(healthInfo, { status: 200 });
}
