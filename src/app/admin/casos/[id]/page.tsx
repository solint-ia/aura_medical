import { AdminJsonEditor } from "@/components/admin/AdminJsonEditor";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminJsonEditor title="Editar caso clínico" endpoint={`/api/admin/catalog/cases/${id}`} dataKey="case" />; }
