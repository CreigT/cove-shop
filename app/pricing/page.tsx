import Link from "next/link";
import { products, formatPrice } from "@/lib/products";

export default function PricingPage() {
  return (
    <div className="wrap section">
      <h1>Prices</h1>
      <p className="lede">Printed in dollars. Cancel a membership from the Stripe receipt.</p>
      <div className="grid" style={{ marginTop: 24 }}>
        {products.map((product) => (
          <article className="card" key={product.slug}>
            <div className="badge">{product.badge}</div>
            <h3>{product.name}</h3>
            <p className="price">{formatPrice(product)}</p>
            <p className="muted">{product.blurb}</p>
            <ul className="clean">
              {product.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="btn" href={`/product/${product.slug}`}>
              Choose
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
