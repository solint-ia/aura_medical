import { redirect } from "next/navigation";

export const metadata = {
  title: "Protocolos Clínicos | Aura Regenera",
  description: "Protocolos biotecnológicos recombinantes para remodelação e regeneração tecidual.",
};

export default function ProtocolsIndexPage() {
  redirect("/catalogo?tipo=protocolos");
}
