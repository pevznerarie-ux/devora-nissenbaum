import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { PRODUCT_NAME, textDirection } from "@pedagoos/shared";
import "./globals.css";

// Charte de design (self-hosted, hors ligne) : Inter pour le texte/UI,
// Fraunces (serif éditoriale) pour les titres.
const inter = localFont({
  variable: "--font-inter",
  display: "swap",
  src: [
    { path: "./fonts/inter-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/inter-700.woff2", weight: "700", style: "normal" },
  ],
});

const fraunces = localFont({
  variable: "--font-fraunces",
  display: "swap",
  src: [
    { path: "./fonts/fraunces-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/fraunces-700.woff2", weight: "700", style: "normal" },
  ],
});

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: PRODUCT_NAME,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html
      lang={locale}
      dir={textDirection(locale)}
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <body className="min-h-dvh font-sans antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
