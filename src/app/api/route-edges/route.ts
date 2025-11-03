import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Route edges API - manages connections between locations with fuel costs
export async function GET() {
  try {
    // For now, we'll store edges in a JSON file or use a simple in-memory structure
    // In production, you might want to add a RouteEdge model to Prisma
    // For now, we'll return a default edge set based on location labels
    
    // Default edges: Z (depot) to all locations, and some common paths
    const defaultEdges: Record<string, Record<string, number>> = {
      Z: { A: 50, B: 60, C: 70, D: 80, E: 90 },
      A: { Z: 50, B: 20, C: 40, D: 60, E: 80 },
      B: { Z: 60, A: 20, C: 30, D: 50, E: 70 },
      C: { Z: 70, A: 40, B: 30, D: 25, E: 50 },
      D: { Z: 80, A: 60, B: 50, C: 25, E: 30 },
      E: { Z: 90, A: 80, B: 70, C: 50, D: 30 },
    };
    
    return NextResponse.json({ edges: defaultEdges });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch route edges" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { from, to, fuelCost } = body as {
      from: string; // Location label (e.g., "Z", "A", "B")
      to: string;
      fuelCost: number; // Fuel cost to travel from 'from' to 'to'
    };
    
    if (!from || !to || fuelCost === undefined) {
      return NextResponse.json({ error: "from, to, and fuelCost are required" }, { status: 400 });
    }
    
    // In a real implementation, you'd save this to a database
    // For now, we'll just return success
    // You can create a RouteEdge model in Prisma schema later if needed
    
    return NextResponse.json({ 
      ok: true, 
      message: "Edge created. Note: This is stored in-memory. Consider adding RouteEdge model for persistence.",
      edge: { from, to, fuelCost }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create route edge" }, { status: 500 });
  }
}

