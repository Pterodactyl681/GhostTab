import { redirect } from "next/navigation";

type CreatePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CreatePage({ params }: CreatePageProps) {
  const { locale } = await params;
  redirect(`/${locale}/app/create`);
}
