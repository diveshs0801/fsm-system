import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type OptimizeBody = {
  technicianId: string;
  date?: string; // ISO date (defaults to today)
};

function toISODate(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString();
}

export async function POST(request: Request) {
  try {
    const body: OptimizeBody = await request.json();
    const { technicianId, date } = body;
    if (!technicianId) {
      return NextResponse.json({ error: "technicianId is required" }, { status: 400 });
    }

    const targetDate = date ? new Date(date) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const technician = await prisma.technician.findUnique({
      where: { id: technicianId },
      include: { user: true },
    });
    if (!technician) return NextResponse.json({ error: "Technician not found" }, { status: 404 });

    const orders = await prisma.workOrder.findMany({
      where: {
        technicianId,
        status: { in: ["PENDING", "SCHEDULED", "IN_PROGRESS"] as any },
        OR: [
          { scheduledDate: null },
          { scheduledDate: { gte: dayStart, lte: dayEnd } },
        ],
      },
      include: {
        customer: true,
      },
    });

    // Simple heuristic: sort by scheduledDate ascending, then by distance from technician current location if available, otherwise by customer name
    const techLat = technician.currentLat ?? 0;
    const techLng = technician.currentLng ?? 0;

    const sorted = orders
      .map((o: typeof orders[number]) => ({
        o,
        distSq:
          ((o.customer?.latitude ?? techLat) - techLat) ** 2 +
          ((o.customer?.longitude ?? techLng) - techLng) ** 2,
      }))
      .sort((a: { o: typeof orders[number]; distSq: number }, b: { o: typeof orders[number]; distSq: number }) => {
        const ad = a.o.scheduledDate?.getTime() ?? 0;
        const bd = b.o.scheduledDate?.getTime() ?? 0;
        if (ad !== bd) return ad - bd;
        if (a.distSq !== b.distSq) return a.distSq - b.distSq;
        return a.o.title.localeCompare(b.o.title);
      })
      .map((x: { o: typeof orders[number]; distSq: number }) => x.o);

    const routeOrder = sorted.map((o: typeof sorted[number]) => o.id);

    const existing = await prisma.technicianSchedule.findFirst({
      where: {
        technicianId,
        date: new Date(toISODate(dayStart)),
      },
    });

    const saved = existing
      ? await prisma.technicianSchedule.update({
          where: { id: existing.id },
          data: { routeOrder },
        })
      : await prisma.technicianSchedule.create({
          data: {
            technicianId,
            date: new Date(toISODate(dayStart)),
            routeOrder,
          },
        });

    return NextResponse.json({ ok: true, schedule: saved });
  } catch (error) {
    return NextResponse.json({ error: "Failed to optimize route" }, { status: 500 });
  }
}


