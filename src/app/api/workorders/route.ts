import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const workOrders = await prisma.workOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        technician: {
          include: { user: true },
        },
        billing: true,
        inventoryItems: { include: { inventoryItem: true } },
      },
    });
    return NextResponse.json(workOrders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch work orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      customerId,
      scheduledDate,
      priority,
      technicianId,
      inventoryItems,
      serviceFee,
    }: {
      title: string;
      description?: string;
      customerId: string;
      scheduledDate?: string;
      priority?: "LOW" | "MEDIUM" | "HIGH";
      technicianId?: string | null;
      inventoryItems?: { inventoryId: string; quantityUsed: number }[];
      serviceFee?: number;
    } = body;

    if (!title || !customerId) {
      return NextResponse.json({ error: "title and customerId are required" }, { status: 400 });
    }

    // Calculate billing from inventory if provided
    let totalAmount = 0;
    if (inventoryItems && inventoryItems.length > 0) {
      const ids = inventoryItems.map((i) => i.inventoryId);
      const items = await prisma.inventoryItem.findMany({ where: { id: { in: ids } } });
      const priceById = Object.fromEntries(
        items.map((inv: { id: string; unitPrice: number }) => [inv.id, inv.unitPrice] as const)
      );
      totalAmount = inventoryItems.reduce((sum, it) => sum + (priceById[it.inventoryId] ?? 0) * Math.max(1, it.quantityUsed), 0);
    }
    if (typeof serviceFee === "number" && !Number.isNaN(serviceFee)) {
      totalAmount += Math.max(0, serviceFee);
    }

    const created = await prisma.workOrder.create({
      data: {
        title,
        description,
        customerId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        priority: (priority ?? "MEDIUM") as any,
        technicianId: technicianId ?? undefined,
        status: "PENDING" as any,
        inventoryItems: inventoryItems && inventoryItems.length > 0 ? {
          create: inventoryItems.map((i) => ({ inventoryId: i.inventoryId, quantityUsed: i.quantityUsed || 1 })),
        } : undefined,
        billing: { create: { totalAmount, status: "PENDING" as any } },
      },
      include: {
        customer: true,
        technician: { include: { user: true } },
        billing: true,
        inventoryItems: { include: { inventoryItem: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create work order" }, { status: 500 });
  }
}


