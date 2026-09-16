import { AdminResourceList } from "@/components/admin/AdminResourceList";
export default function Page() { return <AdminResourceList endpoint="/api/admin/catalog/lines" dataKey="lines" title="Linhas" editBase="/admin/linhas" />; }
