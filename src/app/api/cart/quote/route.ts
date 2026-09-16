import { NextResponse } from "next/server";

import { verifyAuthToken } from "@/lib/auth";
import { verifyCheckoutItems } from "@/lib/checkoutPricing";

export async function POST(req: Request) {
  const auth = verifyAuthToken(req);
  const { items } = await req.json();
  const verified = await verifyCheckoutItems(items, { allowInternal: auth?.role === "ADMIN" });
  if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: verified.status || 400 });
  return NextResponse.json({ items: verified.items, subtotal: verified.subtotal });
}
