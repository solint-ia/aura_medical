import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PurchasePanel } from "./PurchasePanel";
import type { CatalogItem } from "@/data/catalog";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/context/CartContext", () => ({ useCart: () => ({ addToCart: vi.fn() }) }));

const ghk: CatalogItem = {
  slug: "ghk", kind: "product", line: "la-cutanee", name: "GHK-Cu", category: "Sérum",
  summary: "", tags: [], image: "/test.png", presentation: "Frasco de 30 ml",
  offers: [{ id: "ghk", price: 404.85 }], sections: [],
};

describe("PurchasePanel", () => {
  it("recalcula o subtotal e limita a quantidade a 20", async () => {
    const user = userEvent.setup();
    render(<PurchasePanel item={ghk} />);
    const plus = screen.getByRole("button", { name: "Aumentar quantidade" });
    await user.click(plus);
    await user.click(plus);
    expect(screen.getByText("R$ 1.214,55")).toBeInTheDocument();
    for (let index = 3; index < 20; index += 1) await user.click(plus);
    expect(plus).toBeDisabled();
  });
});
