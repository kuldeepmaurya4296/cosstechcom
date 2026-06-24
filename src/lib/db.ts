import mongoose from "mongoose";

// Only import dns and use it if we are in a Node.js environment and not in the Edge runtime
let dns: any;
if (typeof window === "undefined" && process.env.NEXT_RUNTIME !== "edge") {
  try {
    dns = require("dns");
  } catch (e) {
    console.warn("Could not load dns module");
  }
}

import { promisify } from "util";

// Force IPv4 DNS resolution order to prevent querySrv ECONNREFUSED in Next.js runtime
if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}
if (dns) {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  } catch (e) {
    console.warn("Could not set custom DNS servers in DB connection module:", e);
  }
}

const resolveSrv = dns
  ? promisify(dns.resolveSrv)
  : async () => {
      throw new Error("DNS resolution not available in this runtime");
    };

async function resolveMongoSrv(srvUri: string): Promise<string> {
  if (!srvUri.startsWith("mongodb+srv://")) {
    return srvUri;
  }

  try {
    const parsedUrl = new URL(srvUri.replace("mongodb+srv://", "http://"));
    const host = parsedUrl.host;
    const srvDomain = `_mongodb._tcp.${host}`;

    let shardList = "";
    try {
      if (!dns) throw new Error("DNS not available");
      console.log(`Resolving MongoDB SRV records for: ${srvDomain}`);
      const records = await resolveSrv(srvDomain);
      if (records.length === 0) throw new Error("No SRV records returned");
      shardList = records.map((r: any) => `${r.name}:${r.port}`).join(",");
    } catch (err) {
      console.warn("MongoDB SRV lookup failed, falling back to static shard list resolution.", err);
      shardList = process.env.MONGODB_SHARD_LIST || "";
      if (!shardList) {
        console.error(
          "MONGODB_SHARD_LIST environment variable is not defined. Connection might fail.",
        );
      }
    }

    const pathname = parsedUrl.pathname;
    const searchParams = parsedUrl.searchParams;

    if (!searchParams.has("ssl") && !searchParams.has("tls")) {
      searchParams.set("ssl", "true");
    }
    if (!searchParams.has("authSource")) {
      searchParams.set("authSource", "admin");
    }

    const username = parsedUrl.username;
    const password = parsedUrl.password;
    const credentials = username ? `${username}:${password}@` : "";

    const directUri = `mongodb://${credentials}${shardList}${pathname}?${searchParams.toString()}`;
    return directUri;
  } catch (err) {
    console.error("Failed to parse MongoDB URI:", err);
    return srvUri;
  }
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn(
    "MONGODB_URI is not defined in the environment variables. Using simulated database.",
  );
}

/**
 * Cached connection object to prevent multiple connections in development.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (!MONGODB_URI || MONGODB_URI.includes("dummy") || MONGODB_URI === "") {
    console.warn(
      "MongoDB URI is missing or using a dummy value. Database operations are simulated.",
    );
    return null;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      // Serverless tuning: each warm Vercel function instance keeps a tiny pool.
      // Default maxPoolSize (100) x many concurrent lambdas exhausts Atlas connections.
      maxPoolSize: 10,
      minPoolSize: 0,
      socketTimeoutMS: 45000,
      // Compress wire traffic to Atlas — cheaper round-trips on cold paths.
      compressors: ["zlib"] as ("zlib" | "none" | "snappy" | "zstd")[],
    };

    cached.promise = resolveMongoSrv(MONGODB_URI)
      .then((resolvedUri) => {
        console.log("Connecting to database using direct URI connection...");
        return mongoose.connect(resolvedUri, opts);
      })
      .then(async (mongooseInstance) => {
        console.log("Successfully connected to MongoDB.");
        return mongooseInstance;
      })
      .catch((err) => {
        console.error("MongoDB connection failed:", err.message);
        cached.promise = null;
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
    if (!cached.conn) {
      cached.promise = null;
    }
  } catch (e) {
    cached.promise = null;
    console.error("Failed to resolve MongoDB connection promise:", e);
    return null;
  }

  return cached.conn;
}
