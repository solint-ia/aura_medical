import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PurchasePanel } from "./PurchasePanel";
import type { CatalogItem } from "@/data/catalog";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/context/CartContext", () => ({ useCart: () => ({ addToCart: vi.fn() }) }));

const solary: CatalogItem = {
  slug: "solary",
  kind: "product",
  line: "la-cutanee",
  name: "Solary AOX FPS 60",
  category: "Protetor",
  summary: "",
  tags: [],
  image: "/sem-cor.png",
  presentation: "Bisnaga de 40 g",
  variantName: "Tom",
  sections: [],
  offers: [
    { id: "sem-cor", label: "Sem cor", price: 188.85, image: "/sem-cor.png", swatch: { color: "#EFE7DA" } },
    { id: "tom-medio", label: "Tom médio", price: 224.85, image: "/tom-medio.png", swatch: { color: "#C08457" } },
    { id: "tom-escuro", label: "Tom escuro", price: 224.85, swatch: { color: "#6B4226" }, trackStock: true, stock: 0 },
  ],
};

describe("escolha de variação por círculos", () => {
  it("mostra um círculo por variação com o nome da escolha", () => {
    render(<PurchasePanel item={solary} />);
    expect(screen.getByText("Tom")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(2);
    expect(screen.getByRole("button", { pressed: true })).toHaveAccessibleName(/Sem cor/);
  });

  it("troca preço e rótulo ao escolher outro tom", async () => {
    const user = userEvent.setup();
    render(<PurchasePanel item={solary} />);
    expect(screen.getByText("R$ 188,85")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tom médio/ }));
    expect(screen.getByText("R$ 224,85")).toBeInTheDocument();
    expect(screen.getByRole("button", { pressed: true })).toHaveAccessibleName(/Tom médio/);
  });

  it("marca a variação esgotada e impede comprá-la", async () => {
    const user = userEvent.setup();
    render(<PurchasePanel item={solary} />);
    const soldOut = screen.getByRole("button", { name: /Tom escuro \(esgotado\)/ });

    await user.click(soldOut);
    expect(screen.getByRole("status")).toHaveTextContent("Esgotado.");
    expect(screen.queryByRole("button", { name: "Comprar agora" })).not.toBeInTheDocument();
  });

  it("usa pílulas com nome quando nenhuma variação tem cor ou foto", () => {
    const semCor = { ...solary, offers: solary.offers.map(({ swatch: _swatch, ...offer }) => offer) };
    render(<PurchasePanel item={semCor} />);
    expect(screen.getByRole("button", { name: "Sem cor" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { pressed: true })).not.toBeInTheDocument();
  });
});
