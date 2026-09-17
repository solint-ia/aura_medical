import { ProductAdminForm } from "@/components/admin/ProductAdminForm";

export default function Page() {
  return <ProductAdminForm create title="Novo produto" endpoint="/api/admin/catalog/products" />;
}
