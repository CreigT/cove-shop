import { getCatalog, shopProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const catalog = await getCatalog();
  return (
    <div className="wrap section">
      <h1>Shop</h1>
      <p className="lede">Every offer on one page. Read the page. Pay the price you see.</p>
      <div className="grid" style={{ marginTop: 24 }}>
        {shopProducts(catalog).map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
