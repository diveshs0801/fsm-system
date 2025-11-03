import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function extractIdFromUrl(request: Request): string | undefined {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.lastIndexOf("workorders");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    return parts[parts.length - 1];
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  try {
    const id = extractIdFromUrl(request);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        technician: { include: { user: true } },
        billing: true,
        inventoryItems: { include: { inventoryItem: true } },
      },
    });
    if (!workOrder) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(workOrder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch work order" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const id = extractIdFromUrl(request);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      scheduledDate,
      technicianId,
      customerId,
      billingStatus,
      totalAmount,
      addInventoryItems,
    }: {
      title?: string;
      description?: string | null;
      status?: "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
      priority?: "LOW" | "MEDIUM" | "HIGH";
      scheduledDate?: string | null;
      technicianId?: string | null;
      customerId?: string;
      billingStatus?: "PENDING" | "PAID" | "CANCELLED";
      totalAmount?: number;
      addInventoryItems?: { inventoryId: string; quantityUsed: number }[];
    } = body;

    // Build main update data; only include provided fields
    const allowedStatuses = ["PENDING","SCHEDULED","IN_PROGRESS","COMPLETED","CANCELLED"] as const;
    const allowedPriorities = ["LOW","MEDIUM","HIGH"] as const;
    const updateData: Record<string, any> = {
      title: title !== undefined ? title : undefined,
      description: description !== undefined ? description : undefined,
      status: status && (allowedStatuses as readonly string[]).includes(status) ? status : undefined,
      priority: priority && (allowedPriorities as readonly string[]).includes(priority) ? priority : undefined,
      scheduledDate: scheduledDate === undefined ? undefined : scheduledDate ? new Date(scheduledDate) : null,
      technicianId: technicianId === undefined ? undefined : technicianId,
      customerId: customerId !== undefined ? customerId : undefined,
    };
    if (status === "COMPLETED") {
      updateData.completionDate = new Date();
    }
    const data = Object.fromEntries(Object.entries(updateData).filter(([, v]) => v !== undefined));

    const updated = await prisma.workOrder.update({
      where: { id },
      data,
    });

    // Optional: add inventory usage and decrement stock
    if (addInventoryItems && addInventoryItems.length > 0) {
      const itemsToUse = addInventoryItems.map((i) => ({ inventoryId: i.inventoryId, quantityUsed: Math.max(1, i.quantityUsed || 1) }));

      // Record usage
      await prisma.workOrderInventory.createMany({
        data: itemsToUse.map((i) => ({ workOrderId: id, inventoryId: i.inventoryId, quantityUsed: i.quantityUsed })),
      });

      // Decrement stock safely (no negatives)
      const uniqueIds = Array.from(new Set(itemsToUse.map((i) => i.inventoryId)));
      const currentStocks = await prisma.inventoryItem.findMany({ where: { id: { in: uniqueIds } }, select: { id: true, quantity: true } });
      const byId: Record<string, number> = Object.fromEntries(currentStocks.map((it) => [it.id, it.quantity ?? 0]));
      const updates = itemsToUse.map((i) => {
        const current = byId[i.inventoryId] ?? 0;
        const newQty = Math.max(0, current - i.quantityUsed);
        byId[i.inventoryId] = newQty; // ensure multiple uses of same id clamp cumulatively
        return prisma.inventoryItem.update({ where: { id: i.inventoryId }, data: { quantity: newQty } });
      });
      if (updates.length > 0) {
        await prisma.$transaction(updates);
      }
    }

    // Optional: update or create billing
    if (billingStatus !== undefined || totalAmount !== undefined) {
      const existing = await prisma.billing.findFirst({ where: { workOrderId: id } });
      if (existing) {
        await prisma.billing.update({
          where: { id: existing.id },
          data: {
            status: (billingStatus as any) ?? undefined,
            totalAmount: totalAmount ?? undefined,
          },
        });
      } else {
        await prisma.billing.create({
          data: {
            workOrderId: id,
            status: (billingStatus as any) ?? ("PENDING" as any),
            totalAmount: totalAmount ?? 0,
          },
        });
      }
    }

    const withRelations = await prisma.workOrder.findUnique({
      where: { id },
      include: { customer: true, technician: { include: { user: true } }, billing: true, inventoryItems: { include: { inventoryItem: true } } },
    });
    return NextResponse.json(withRelations);
  } catch (error: any) {
    console.error("PATCH /api/workorders/[id] error:", error);
    return NextResponse.json({ error: "Failed to update work order", detail: String(error?.message ?? error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = extractIdFromUrl(request);
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await prisma.workOrder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete work order" }, { status: 500 });
  }
}


