import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: params.id },
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

export async function PATCH(request: Request, { params }: Params) {
  try {
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

    // Build main update data
    const data: any = {
      title,
      description,
      status: status as any,
      priority: priority as any,
      scheduledDate: scheduledDate === undefined ? undefined : scheduledDate ? new Date(scheduledDate) : null,
      technicianId: technicianId === undefined ? undefined : technicianId,
      customerId,
    };
    if (status === "COMPLETED") {
      data.completionDate = new Date();
    }

    const updated = await prisma.workOrder.update({
      where: { id: params.id },
      data,
    });

    // Optional: add inventory usage
    if (addInventoryItems && addInventoryItems.length > 0) {
      await prisma.workOrderInventory.createMany({
        data: addInventoryItems.map((i) => ({ workOrderId: params.id, inventoryId: i.inventoryId, quantityUsed: i.quantityUsed || 1 })),
      });
    }

    // Optional: update or create billing
    if (billingStatus !== undefined || totalAmount !== undefined) {
      const existing = await prisma.billing.findUnique({ where: { workOrderId: params.id } });
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
            workOrderId: params.id,
            status: (billingStatus as any) ?? ("PENDING" as any),
            totalAmount: totalAmount ?? 0,
          },
        });
      }
    }

    const withRelations = await prisma.workOrder.findUnique({
      where: { id: params.id },
      include: { customer: true, technician: { include: { user: true } }, billing: true, inventoryItems: { include: { inventoryItem: true } } },
    });
    return NextResponse.json(withRelations);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update work order" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await prisma.workOrder.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete work order" }, { status: 500 });
  }
}


