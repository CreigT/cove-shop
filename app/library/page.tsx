import { cookies } from "next/headers";
import Link from "next/link";
import { ACCESS_COOKIE, decodeAccess } from "@/lib/access";
import { getProduct } from "@/lib/products";
import { libraryItems } from "@/lib/library";

export default function LibraryPage() {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  const access = decodeAccess(token);

  if (!access) {
    return (
      <div className="wrap section">
        <h1>Library</h1>
        <p className="lede">This shelf is locked until you buy a pack on this browser.</p>
        <p className="notice">Buy a pack, then come back here. Access is saved as a signed cookie.</p>
        <div className="row">
          <Link className="btn" href="/shop">
            Go to the shop
          </Link>
        </div>
      </div>
    );
  }

  const unlocked = access.slugs
    .map((slug) => ({ slug, product: getProduct(slug), items: libraryItems[slug] || [] }))
    .filter((entry) => entry.product);

  return (
    <div className="wrap section">
      <h1>Your library</h1>
      <p className="lede">Signed in as {access.email} on this browser.</p>
      {unlocked.map((entry) => (
        <section key={entry.slug} className="section" style={{ paddingTop: 16 }}>
          <h2>{entry.product?.name}</h2>
          {entry.items.map((item) => (
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
