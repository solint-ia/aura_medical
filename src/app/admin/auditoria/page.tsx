import { AdminResourceList } from "@/components/admin/AdminResourceList";
export default function Page() { return <AdminResourceList endpoint="/api/admin/audit" dataKey="logs" title="Auditoria" />; }
