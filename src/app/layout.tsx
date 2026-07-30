import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StoreProvider } from "@/components/store-provider";
import { getCommerceReadiness } from "@/lib/commerce";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sneaker Vault GH | Sneakers in Ghana",
    template: "%s | Sneaker Vault GH",
  },
  description:
    "Shop a focused sneaker selection in Ghana with live EU size availability and prices in Ghana cedis.",
  applicationName: "Sneaker Vault GH",
  keywords: [
    "Sneaker Vault GH",
    "sneakers Ghana",
    "sneakers Accra",
    "shoe store Ghana",
    "EU sneaker sizes",
  ],
  openGraph: {
    type: "website",
    locale: "en_GH",
    siteName: "Sneaker Vault GH",
    title: "Sneaker Vault GH | Find your next pair",
    description:
      "A focused sneaker selection with clear EU size availability and Ghana cedi pricing.",
    url: "/",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Sneaker Vault GH",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sneaker Vault GH | Find your next pair",
    description:
      "A focused sneaker selection with clear EU size availability and Ghana cedi pricing.",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0e4e3e",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const commerce = getCommerceReadiness();

  return (
    <html lang="en-GH">
      <body>
        <StoreProvider
          initialMode={
            commerce.storefrontConnected ? "shopify" : "demo"
          }
        >
          <a
            href="#main-content"
            className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-ink shadow-lg transition-transform focus:translate-y-0"
          >
            Skip to content
          </a>
          <SiteHeader />
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
          <SiteFooter />
        </StoreProvider>
      </body>
    </html>
  );
}
