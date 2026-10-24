import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContactDock } from "@/components/contact-dock";

export const metadata: Metadata = {
  metadataBase: new URL("https://vtwardrobes.com.au"),
  title: { default: "VT Wardrobes | Custom Wardrobes Melbourne", template: "%s | VT Wardrobes" },
  description: "Custom wardrobes, interiors and sliding doors, measured and installed across metropolitan Melbourne.",
  openGraph: { title: "VT Wardrobes", description: "Wardrobes designed around your life.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body><a className="skip-link" href="#main">Skip to content</a><Header />{children}<Footer /><ContactDock /></body>
    </html>
  );
}
