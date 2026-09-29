import Link from "next/link";
import { Product, formatPrice } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="card">
      {product.badge ? <div className="badge">{product.badge}</div> : null}
      <h3>{product.name}</h3>
      <p className="price">{formatPrice(product)}</p>
      <p className="muted">{product.blurb}</p>
      <Link className="btn" href={`/product/${product.slug}`}>
        View
      </Link>
    </article>
  );
}
