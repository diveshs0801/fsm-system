import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, address, latitude, longitude, complaintDescription, complaintType } = body as {
      name: string;
      phone?: string;
      email?: string;
      address: string;
      latitude?: number;
      longitude?: number;
      complaintDescription?: string;
      complaintType?: "AC" | "FAN" | "CYLINDER";
    };
    if (!name || !address) {
      return NextResponse.json({ error: "name and address are required" }, { status: 400 });
    }
    const created = await prisma.customer.create({
      data: { name, phone, email, address, latitude, longitude, complaintDescription, complaintType: (complaintType as any) ?? undefined },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}


