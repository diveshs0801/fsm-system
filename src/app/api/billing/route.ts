import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const billing = await prisma.billing.findMany({
      orderBy: { createdAt: "desc" },
      include: { workOrder: { include: { customer: true, technician: { include: { user: true } } } } },
    });
    return NextResponse.json(billing);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch billing" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workOrderId, totalAmount, status, invoiceNumber } = body as {
      workOrderId: string;
      totalAmount?: number;
      status?: "PENDING" | "PAID" | "CANCELLED";
      invoiceNumber?: string | null;
    };
    if (!workOrderId) {
      return NextResponse.json({ error: "workOrderId is required" }, { status: 400 });
    }
    const existing = await prisma.billing.findUnique({ where: { workOrderId } });
    const record = existing
      ? await prisma.billing.update({
          where: { id: existing.id },
          data: {
            totalAmount: totalAmount ?? existing.totalAmount,
            status: (status as any) ?? existing.status,
            invoiceNumber: invoiceNumber === undefined ? existing.invoiceNumber : invoiceNumber,
          },
        })
      : await prisma.billing.create({
          data: {
            workOrderId,
            totalAmount: totalAmount ?? 0,
            status: (status as any) ?? ("PENDING" as any),
            invoiceNumber: invoiceNumber ?? null,
          },
        });
    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json({ error: "Failed to upsert billing" }, { status: 500 });
  }
}


