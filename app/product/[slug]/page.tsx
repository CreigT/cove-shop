import { notFound } from "next/navigation";
import { getProduct, formatPrice } from "@/lib/products";
import { CheckoutForm } from "@/components/CheckoutForm";
import { isDemoMode } from "@/lib/config";

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  return (
    <div className="wrap section">
      <p className="badge">{product.badge}</p>
      <h1>{product.name}</h1>
      <p className="price">{formatPrice(product)}</p>
      <p className="lede">{product.description}</p>
      <ul className="clean">
        {product.includes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {isDemoMode() ? (
        <p className="notice">Demo mode is on. No card will be charged.</p>
      ) : null}
      <div style={{ marginTop: 20 }}>
        <CheckoutForm slug={product.slug} />
      </div>
    </div>
  );
}
