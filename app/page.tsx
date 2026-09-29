import Link from "next/link";
import { shopProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { store } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="wrap">
      <section className="hero">
        <p className="badge">Simple shop · fair prices · open 24/7</p>
        <h1>Buy a small digital pack. Agents run the rest.</h1>
        <p className="lede">
          {store.tagline} You add your name and keys. Then you deploy. Help,
          refunds, and the library live on the same site.
        </p>
        <div className="row">
          <Link className="btn" href="/shop">
            Open the shop
          </Link>
          <Link className="btn ghost" href="/help">
            Need help?
          </Link>
        </div>
      </section>

      <section className="section">
        <h2>Three steps</h2>
        <div className="grid">
          <article className="card">
            <div className="badge">1</div>
            <h3>Pick a pack</h3>
            <p className="muted">$9 to start, $29 for the full kit, $19 a month if you want updates.</p>
          </article>
          <article className="card">
            <div className="badge">2</div>
            <h3>Pay the printed price</h3>
            <p className="muted">Stripe when keys exist. Demo mode when they do not. No hidden upsells.</p>
          </article>
          <article className="card">
            <div className="badge">3</div>
            <h3>Open the library</h3>
            <p className="muted">Access stays on this browser. Help and refunds are one tap away.</p>
          </article>
        </div>
      </section>

      <section className="section">
        <h2>On the shelf</h2>
        <p className="muted">Reasonable paywalls. Nothing over $29 unless you choose the monthly pass.</p>
        <div className="grid" style={{ marginTop: 18 }}>
          {shopProducts().map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
