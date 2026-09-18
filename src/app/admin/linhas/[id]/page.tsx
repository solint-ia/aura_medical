import { LineAdminForm } from "@/components/admin/LineAdminForm";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <LineAdminForm endpoint={`/api/admin/catalog/lines/${id}`} />; }
