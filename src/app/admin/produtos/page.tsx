import { AdminResourceList } from "@/components/admin/AdminResourceList";
export default function Page() { return <AdminResourceList endpoint="/api/admin/catalog/products" dataKey="products" title="Produtos" editBase="/admin/produtos" />; }
