import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const technicianId = searchParams.get("technicianId") || undefined;

    // Base inventory list
    const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
    const byId = Object.fromEntries(items.map((i) => [i.id, i] as const));

    // Aggregate usage
    if (technicianId) {
      // Usage only for work orders of this technician
      const usage = await prisma.workOrderInventory.groupBy({
        by: ["inventoryId"],
        _sum: { quantityUsed: true },
        where: {
          workOrder: { technicianId },
        },
      });
      const result = usage
        .filter((u) => !!byId[u.inventoryId])
        .map((u) => {
          const it = byId[u.inventoryId];
          return {
            id: it.id,
            name: it.name,
            unitPrice: it.unitPrice,
            quantity: it.quantity ?? 0,
            usedCount: u._sum.quantityUsed ?? 0,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      return NextResponse.json(result);
    } else {
      // Global usage across all technicians
      const usage = await prisma.workOrderInventory.groupBy({
        by: ["inventoryId"],
        _sum: { quantityUsed: true },
      });
      const usedById = Object.fromEntries(usage.map((u) => [u.inventoryId, u._sum.quantityUsed ?? 0] as const));
      const result = items.map((it) => ({
        id: it.id,
        name: it.name,
        unitPrice: it.unitPrice,
        quantity: it.quantity ?? 0,
        usedCount: usedById[it.id] ?? 0,
      }));
      return NextResponse.json(result);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch inventory usage" }, { status: 500 });
  }
}


