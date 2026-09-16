import { AdminJsonEditor } from "@/components/admin/AdminJsonEditor";
export default function Page() { return <AdminJsonEditor create title="Novo produto" endpoint="/api/admin/catalog/products" dataKey="product" template={{ lineId: "", slug: "", name: "", eyebrow: "", summary: "", presentation: "", highlights: [], specs: [], featured: false, sortOrder: 0 }} />; }
