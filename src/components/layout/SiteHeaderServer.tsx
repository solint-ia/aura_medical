import { SiteHeader } from "./SiteHeader";
import { getPublishedLines } from "@/server/catalog/repository";

export async function SiteHeaderServer() {
  const lines = await getPublishedLines();
  return <SiteHeader lines={lines.map(({ slug, name, descriptor }) => ({ slug, name, descriptor }))} />;
}
