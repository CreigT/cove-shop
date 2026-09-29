import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, decodeAccess } from "@/lib/access";

export async function GET() {
  const access = decodeAccess(cookies().get(ACCESS_COOKIE)?.value);
  return NextResponse.json({ access });
}
