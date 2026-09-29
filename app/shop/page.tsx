import { shopProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export default function ShopPage() {
  return (
    <div className="wrap section">
      <h1>Shop</h1>
      <p className="lede">Three offers. Read the page. Pay the price you see.</p>
      <div className="grid" style={{ marginTop: 24 }}>
        {shopProducts().map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
