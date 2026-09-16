import { permanentRedirect } from "next/navigation";

export default async function LegacyEnzymePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const legacySlugs: Record<string, string> = { slim: "slim-plus", smooth: "smooth-plus", drain: "drain-plus" };
  permanentRedirect(`/produtos/${legacySlugs[slug] ?? slug}`);
}
