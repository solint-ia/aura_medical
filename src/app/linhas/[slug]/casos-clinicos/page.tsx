import { permanentRedirect } from "next/navigation";
export default async function LegacyLineCasesPage({ params }: { params: Promise<{ slug: string }> }) { permanentRedirect(`/linhas/${(await params).slug}`); }
