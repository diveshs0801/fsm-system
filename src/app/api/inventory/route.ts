import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, sku, quantity, unitPrice } = body as {
      name: string;
      sku?: string;
      quantity?: number;
      unitPrice: number;
    };
    if (!name || unitPrice === undefined) {
      return NextResponse.json({ error: "name and unitPrice are required" }, { status: 400 });
    }
    const created = await prisma.inventoryItem.create({
      data: { name, sku, quantity: quantity ?? 0, unitPrice },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
  }
}


