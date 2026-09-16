import { AdminResourceList } from "@/components/admin/AdminResourceList";
export default function Page() { return <AdminResourceList endpoint="/api/admin/content/faq" dataKey="items" title="Conteúdo e FAQ" />; }
