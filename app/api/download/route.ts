import { NextResponse } from "next/server";
import { accessCookie, decodeDownload, encodeAccess, ACCESS_MAX_AGE } from "@/lib/access";
import { getOrder } from "@/lib/db";
import { getCatalog } from "@/lib/products";
import { store } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") || "";
  const grant = decodeDownload(token);
  if (!grant) {
    return new NextResponse(
      "This download link is invalid or expired. Open /library on the browser you paid from, or ask on /help.",
      { status: 410 }
    );
  }
  const order = await getOrder(grant.orderId);
  if (order?.status === "refunded") {
    return new NextResponse("This order was refunded, so the files are closed.", { status: 403 });
  }

  if (url.searchParams.get("file") === "1") {
    const catalog = await getCatalog({ includeDrafts: true });
    const sections = grant.slugs
      .map((slug) => catalog.find((p) => p.slug === slug))
      .filter((p) => p !== undefined)
      .map((p) => [`## ${p.name}`, ...p.items.map((i) => `### ${i.title}\n\n${i.body}`)].join("\n\n"));
    const body = [`# ${store.name} library`, `Order ${grant.orderId}`, ...sections].join("\n\n");
    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${store.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-library.md"`,
      },
    });
  }

  const response = NextResponse.redirect(new URL(`/library?dl=${encodeURIComponent(token)}`, request.url));
  response.cookies.set(
    accessCookie(encodeAccess({ email: grant.email, slugs: grant.slugs, exp: Date.now() + ACCESS_MAX_AGE * 1000 }))
  );
  return response;
}
