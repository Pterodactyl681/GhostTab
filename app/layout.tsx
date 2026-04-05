import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

const sans = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ghosttab.local"),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${sans.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
