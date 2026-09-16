import { AdminResourceList } from "@/components/admin/AdminResourceList";
export default function Page() { return <AdminResourceList endpoint="/api/admin/catalog/categories" dataKey="categories" title="Categorias" editBase="/admin/categorias" />; }
