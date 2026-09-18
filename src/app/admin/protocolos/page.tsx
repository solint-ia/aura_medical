import { AdminCardGrid } from "@/components/admin/AdminCardGrid";

export default function Page() {
  return <AdminCardGrid endpoint="/api/admin/catalog/protocols" dataKey="protocols" title="Protocolos" eyebrow="Catálogo" editBase="/admin/protocolos" variant="protocol" createLabel="Novo protocolo" />;
}
