import { AdminCardGrid } from "@/components/admin/AdminCardGrid";

export default function Page() {
  return <AdminCardGrid endpoint="/api/admin/catalog/cases" dataKey="cases" title="Casos clínicos" eyebrow="Catálogo" variant="case" description="Os casos são criados dentro do produto ou protocolo, na aba Antes e depois. Esta tela mostra todos juntos para conferir o direito de imagem." />;
}
