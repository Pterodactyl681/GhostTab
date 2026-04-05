import type { Metadata } from "next";
import { Geist, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

const appSans = Geist({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--app-font-sans",
});

const appMono = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--app-font-mono",
  weight: ["400", "500", "600"],
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
      <body className={`${appSans.variable} ${appMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
