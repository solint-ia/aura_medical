import { AdminResourceList } from "@/components/admin/AdminResourceList";
export default function Page() { return <AdminResourceList endpoint="/api/admin/catalog/skus?visibility=INTERNAL" dataKey="skus" title="SKUs internos de teste" />; }
