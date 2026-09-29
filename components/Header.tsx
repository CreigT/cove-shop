import Link from "next/link";
import { store } from "@/lib/config";

export function Header() {
  return (
    <header className="wrap">
      <nav className="nav">
        <Link className="brand" href="/">
          {store.name}
        </Link>
        <div className="nav-links">
          <Link href="/shop">Shop</Link>
          <Link href="/pricing">Prices</Link>
          <Link href="/library">Library</Link>
          <Link href="/help">Help</Link>
          <Link href="/agents">Agents</Link>
        </div>
      </nav>
    </header>
  );
}
