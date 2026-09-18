import { AdminCardGrid } from "@/components/admin/AdminCardGrid";

export default function Page() {
  return <AdminCardGrid endpoint="/api/admin/catalog/lines" dataKey="lines" title="Marcas" eyebrow="Catálogo" editBase="/admin/linhas" variant="line" createLabel="Nova marca" />;
}
