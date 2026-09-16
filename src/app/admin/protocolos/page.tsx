import { AdminResourceList } from "@/components/admin/AdminResourceList";
export default function Page() { return <AdminResourceList endpoint="/api/admin/catalog/protocols" dataKey="protocols" title="Protocolos" editBase="/admin/protocolos" />; }
