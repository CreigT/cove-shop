import { getProduct, formatPrice } from "@/lib/products";
import { CheckoutForm } from "@/components/CheckoutForm";
import { isDemoMode } from "@/lib/config";

export default function CarePage() {
  const product = getProduct("care-pass")!;

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
        <p className="notice">Demo mode is on. The pass unlocks without a charge.</p>
      ) : null}
      <div style={{ marginTop: 20 }}>
        <CheckoutForm slug={product.slug} />
      </div>
    </div>
  );
}
