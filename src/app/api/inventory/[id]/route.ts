import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const body = await request.json();
    const { quantityUsed, name, sku, quantity, unitPrice } = body as {
      quantityUsed?: number;
      name?: string;
      sku?: string | null;
      quantity?: number;
      unitPrice?: number;
    };

    if (quantityUsed !== undefined) {
      const current = await prisma.inventoryItem.findUnique({ where: { id: params.id } });
      if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const newQty = Math.max(0, (current.quantity ?? 0) - Math.max(0, quantityUsed));
      const updated = await prisma.inventoryItem.update({ where: { id: params.id }, data: { quantity: newQty } });
      return NextResponse.json(updated);
    }

    const updated = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        name: name ?? undefined,
        sku: sku === undefined ? undefined : sku,
        quantity: quantity ?? undefined,
        unitPrice: unitPrice ?? undefined,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 });
  }
}


