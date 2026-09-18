import { AdminCardGrid } from "@/components/admin/AdminCardGrid";

export default function Page() {
  return <AdminCardGrid endpoint="/api/admin/catalog/products" dataKey="products" title="Produtos" eyebrow="Catálogo" editBase="/admin/produtos" variant="product" createLabel="Novo produto" />;
}
