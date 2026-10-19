import { cookies } from "next/headers";
import Link from "next/link";
import { ACCESS_COOKIE, decodeAccess } from "@/lib/access";
import { getCatalog } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }: { searchParams: { dl?: string } }) {
  const access = decodeAccess(cookies().get(ACCESS_COOKIE)?.value);

  if (!access) {
    return (
      <div className="wrap section">
        <h1>Library</h1>
        <p className="lede">This shelf is locked. Open the link in your receipt email, or buy a pack.</p>
        <p className="notice">Access is saved as a signed cookie on the browser that opens the link.</p>
        <div className="row">
          <Link className="btn" href="/shop">
            Go to the shop
          </Link>
        </div>
      </div>
    );
  }

  const catalog = await getCatalog({ includeDrafts: true });
  const unlocked = access.slugs
    .map((slug) => catalog.find((p) => p.slug === slug))
    .filter((product) => product !== undefined);

  return (
    <div className="wrap section">
      <h1>Your library</h1>
      <p className="lede">Signed in as {access.email} on this browser.</p>
      {searchParams.dl ? (
        <div className="row">
          <a className="btn ghost" href={`/api/download?token=${encodeURIComponent(searchParams.dl)}&file=1`}>
            Download as a file
          </a>
        </div>
      ) : null}
      {unlocked.map((product) => (
        <section key={product.slug} className="section" style={{ paddingTop: 16 }}>
          <h2>{product.name}</h2>
          {product.items.map((item) => (
            <article className="card" key={item.title} style={{ marginBottom: 12 }}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
