import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SPONSOR, store } from "@/lib/config";

export const metadata: Metadata = {
  title: `${store.name} — simple digital shop`,
  description: `${store.tagline} ${SPONSOR}.`,
  other: { sponsor: "CREIGNIFICENT LLC" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
