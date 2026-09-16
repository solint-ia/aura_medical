import { AdminResourceList } from "@/components/admin/AdminResourceList";
export default function Page() { return <AdminResourceList endpoint="/api/admin/catalog/cases" dataKey="cases" title="Casos clínicos" editBase="/admin/casos" />; }
