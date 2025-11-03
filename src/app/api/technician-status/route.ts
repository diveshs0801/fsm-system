import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { technicianId, status, lat, lng } = body as {
      technicianId: string;
      status?: "AVAILABLE" | "BUSY" | "OFFLINE";
      lat?: number;
      lng?: number;
    };
    if (!technicianId) {
      return NextResponse.json({ error: "technicianId is required" }, { status: 400 });
    }
    const updated = await prisma.technician.update({
      where: { id: technicianId },
      data: {
        currentStatus: (status as any) ?? undefined,
        currentLat: lat ?? undefined,
        currentLng: lng ?? undefined,
      },
      include: { user: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update technician status" }, { status: 500 });
  }
}


