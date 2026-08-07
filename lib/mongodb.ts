import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

// Inject Logger for API Responses globally in development
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  if (!(globalThis as any).__apiLoggerInjected) {
    const originalJson = NextResponse.json;
    NextResponse.json = function <JsonBody>(body: JsonBody, init?: ResponseInit): NextResponse<JsonBody> {
      const status = init?.status || 200;
      let statusColor = '\x1b[32m'; // Green
      if (status >= 300 && status < 400) statusColor = '\x1b[33m'; // Yellow
      if (status >= 400) statusColor = '\x1b[31m'; // Red

      console.log(`\n\x1b[1m\x1b[34m[API RESPONSE]\x1b[0m Status: ${statusColor}${status}\x1b[0m`);
      try {
        const bodyStr = JSON.stringify(body, null, 2);
        // Truncate very long responses so terminal isn't flooded completely
        console.log(bodyStr.length > 2000 ? bodyStr.substring(0, 2000) + '... (truncated)' : bodyStr);
      } catch (e) {
        console.log(body);
      }
      return originalJson.call(NextResponse, body, init) as NextResponse<JsonBody>;
    };
    (globalThis as any).__apiLoggerInjected = true;
  }
}

// Cache the connection to avoid reconnecting on every API call (Next.js hot reload)
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
