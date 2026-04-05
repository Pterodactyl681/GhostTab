import { notFound } from "next/navigation";

import { AppTopbar } from "@/components/site/app-topbar";
import { SolanaWalletProvider } from "@/components/site/solana-wallet-provider";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

type ProductAppLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProductAppLayout({
  children,
  params,
}: ProductAppLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <SolanaWalletProvider>
      <AppTopbar locale={locale} dictionary={dictionary.common} nav={dictionary.app.nav} />
      <main
        id="content"
        className="mx-auto w-full max-w-6xl flex-1 px-3 pb-6 pt-5 sm:px-4 sm:pt-6 md:px-6 md:pb-8 md:pt-10"
      >
        {children}
      </main>
    </SolanaWalletProvider>
  );
}
