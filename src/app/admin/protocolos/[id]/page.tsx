import { ProtocolAdminForm } from "@/components/admin/ProtocolAdminForm";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ProtocolAdminForm endpoint={`/api/admin/catalog/protocols/${id}`} />; }
