import { ProductAdminForm } from "@/components/admin/ProductAdminForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductAdminForm title="Editar produto" endpoint={`/api/admin/catalog/products/${id}`} />;
}
