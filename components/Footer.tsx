import Link from "next/link";
import { SPONSOR, store } from "@/lib/config";

export function Footer() {
  return (
    <footer className="wrap">
      <div className="footer">
        <span className="footer-brand">
          {store.name} · {SPONSOR}
        </span>
        <div className="footer-links">
          <Link href="/help">Help</Link>
          <Link href="/refund">Refunds</Link>
          <Link href="/reviews">Reviews</Link>
          <Link href="/legal">Legal</Link>
          <a href={`mailto:${store.support}`}>{store.support}</a>
        </div>
      </div>
    </footer>
  );
}
