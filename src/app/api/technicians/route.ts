import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const technicians = await prisma.technician.findMany({
      orderBy: { createdAt: "asc" },
      include: { user: true },
    });
    return NextResponse.json(technicians);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch technicians" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, specialty } = body as {
      name: string;
      email?: string;
      password?: string;
      specialty?: "AC" | "FAN" | "CYLINDER";
    };
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

    const userEmail = email ?? `tech_${Date.now()}_${Math.floor(Math.random()*1000)}@example.com`;
    const userPassword = password ?? Math.random().toString(36).slice(2, 10);

    const created = await prisma.user.create({
      data: {
        name,
        email: userEmail,
        password: userPassword,
        role: "TECHNICIAN" as any,
        technician: {
          create: {
            skills: [],
            specialty: (specialty as any) ?? undefined,
          },
        },
      },
      include: { technician: true },
    });

    return NextResponse.json(created.technician, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create technician" }, { status: 500 });
  }
}


