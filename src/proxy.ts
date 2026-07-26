import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight proxy - just pass through, no DB queries, no rate limiting
// This is temporary to keep the server alive in the cloud environment
export function proxy(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|images|project-backup.zip).*)"],
};
