import { AdminJsonEditor } from "@/components/admin/AdminJsonEditor";
export default function Page() { return <AdminJsonEditor create title="Nova categoria" endpoint="/api/admin/catalog/categories" dataKey="category" template={{ lineId: null, slug: "", name: "", sortOrder: 0 }} />; }
