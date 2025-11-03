import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const technicianId = searchParams.get("technicianId");
    if (!technicianId) {
      return NextResponse.json({ error: "technicianId is required" }, { status: 400 });
    }

    const technician = await prisma.technician.findUnique({
      where: { id: technicianId },
      include: { user: true },
    });
    if (!technician) return NextResponse.json({ error: "Technician not found" }, { status: 404 });

    // Find latest schedule for today (fallback to latest overall)
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    let schedule = await prisma.technicianSchedule.findFirst({
      where: { technicianId, date: { gte: start, lte: end } },
      orderBy: { createdAt: "desc" },
    });
    if (!schedule) {
      schedule = await prisma.technicianSchedule.findFirst({
        where: { technicianId },
        orderBy: { createdAt: "desc" },
      });
    }

    const workOrders = await prisma.workOrder.findMany({
      where: { technicianId },
      include: { customer: true, billing: true },
      orderBy: { createdAt: "desc" },
    });

    const response = {
      technician: { id: technician.id, name: technician.user.name },
      todaySchedule: schedule
        ? {
            routeOrder: (schedule.routeOrder as unknown as string[]) ?? [],
            totalDistance: schedule.totalDistance ?? null,
            totalDuration: schedule.totalDuration ?? null,
          }
        : null,
      workOrders: workOrders.map((w) => ({
        id: w.id,
        title: w.title,
        status: w.status,
        customer: w.customer ? { name: w.customer.name, address: w.customer.address } : null,
        billingStatus: w.billing?.status ?? "PENDING",
      })),
    };
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch technician dashboard" }, { status: 500 });
  }
}


