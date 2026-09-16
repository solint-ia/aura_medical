import { AdminJsonEditor } from "@/components/admin/AdminJsonEditor";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AdminJsonEditor title="Editar produto" endpoint={`/api/admin/catalog/products/${id}`} dataKey="product" />; }
