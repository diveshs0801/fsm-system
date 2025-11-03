import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type OptimizeBody = {
  technicianId: string;
  date?: string; // ISO date (defaults to today)
  depotLabel?: string; // Depot label (default: "Z")
  serviceTimePerJob?: number; // Service time per job in minutes (default: 30)
};

function toISODate(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString();
}

// Extract location label from address (e.g., "A", "B", "Location C", etc.)
function extractLocationLabel(address: string): string | null {
  // Try to find single letter (A-Z) at start or in parentheses
  const letterMatch = address.match(/\b([A-Z])\b|\(([A-Z])\)/i);
  if (letterMatch) return letterMatch[1]?.toUpperCase() || letterMatch[2]?.toUpperCase() || null;
  
  // Try "Location X" pattern
  const locationMatch = address.match(/location\s+([A-Z])/i);
  if (locationMatch) return locationMatch[1].toUpperCase();
  
  // Try to extract from start of string
  const startMatch = address.trim().match(/^([A-Z])[^A-Z]/i);
  if (startMatch) return startMatch[1].toUpperCase();
  
  return null;
}

// Generate default fuel cost for any location pair
function generateDefaultFuelCost(from: string, to: string): number {
  // If both are single letters (A-Z), use letter distance
  if (from.length === 1 && to.length === 1 && /^[A-Z]$/i.test(from) && /^[A-Z]$/i.test(to)) {
    const fromCode = from.toUpperCase().charCodeAt(0);
    const toCode = to.toUpperCase().charCodeAt(0);
    const letterDist = Math.abs(fromCode - toCode);
    // Base cost: 10 per letter + minimum 20
    return 20 + (letterDist * 10);
  }
  
  // If one is depot (Z) and other is a letter
  if ((from === "Z" || to === "Z") && from !== to) {
    const letter = from === "Z" ? to : from;
    if (letter.length === 1 && /^[A-Z]$/i.test(letter)) {
      const letterCode = letter.toUpperCase().charCodeAt(0);
      const distFromA = letterCode - 65; // A = 65
      return 40 + (distFromA * 10); // Z->A = 40, Z->B = 50, Z->C = 60, etc.
    }
  }
  
  // Default: assume moderate distance for unknown labels
  return 50;
}

// Get fuel cost between two locations from edges
function getFuelCost(from: string, to: string, edges: Record<string, Record<string, number>>): number {
  // Check direct edge
  if (edges[from] && edges[from][to] !== undefined) {
    return edges[from][to];
  }
  
  // Check reverse edge (assume symmetric)
  if (edges[to] && edges[to][from] !== undefined) {
    return edges[to][from];
  }
  
  // Generate default cost based on location labels
  return generateDefaultFuelCost(from, to);
}

// TSP Solver using Nearest Neighbor + 2-opt improvement
function solveTSP(
  nodes: Array<{ id: string; label: string }>,
  depot: { label: string },
  costMatrix: number[][],
  depotIndex: number
): number[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) return [0];

  // Nearest Neighbor heuristic starting from depot
  const n = nodes.length;
  const visited = new Set<number>();
  const route: number[] = [depotIndex];
  visited.add(depotIndex);
  
  let current = depotIndex;
  while (visited.size < n) {
    let nearest = -1;
    let minDist = Infinity;
      for (let i = 0; i < n; i++) {
        if (!visited.has(i) && costMatrix[current][i] < minDist) {
          minDist = costMatrix[current][i];
          nearest = i;
        }
      }
    if (nearest >= 0) {
      route.push(nearest);
      visited.add(nearest);
      current = nearest;
    } else break;
  }
  
  // Must return to depot at the end
  route.push(depotIndex);

  // 2-opt improvement
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length - 1; j++) {
        const before = costMatrix[route[i - 1]][route[i]] + costMatrix[route[j]][route[j + 1]];
        const after = costMatrix[route[i - 1]][route[j]] + costMatrix[route[i]][route[j + 1]];
        if (after < before) {
          // Reverse segment between i and j
          route.splice(i, j - i + 1, ...route.slice(i, j + 1).reverse());
          improved = true;
        }
      }
    }
  }

  // Remove depot from middle (keep only start and end)
  const filtered = [route[0]];
  for (let i = 1; i < route.length - 1; i++) {
    if (route[i] !== depotIndex) filtered.push(route[i]);
  }
  filtered.push(route[route.length - 1]);
  return filtered.slice(1, -1); // Remove depot nodes, return only customer indices
}

export async function POST(request: Request) {
  try {
    const body: OptimizeBody = await request.json();
    const { technicianId, date, depotLabel = "Z", serviceTimePerJob = 30 } = body;
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

    // Check if schedule already exists for today BEFORE optimization
    const existing = await prisma.technicianSchedule.findFirst({
      where: {
        technicianId,
        date: new Date(toISODate(dayStart)),
      },
    });

    if (orders.length === 0) {
      const saved = existing
        ? await prisma.technicianSchedule.update({
            where: { id: existing.id },
            data: { routeOrder: [], totalDistance: 0, totalDuration: 0 } as any,
          })
        : await prisma.technicianSchedule.create({
            data: {
              technicianId,
              date: new Date(toISODate(dayStart)),
              routeOrder: [],
              totalDistance: 0,
              totalDuration: 0,
            } as any,
          });
      return NextResponse.json({ ok: true, schedule: saved });
    }

    // If schedule exists and has routeOrder, check if orders match (avoid re-optimization)
    if (existing && existing.routeOrder && Array.isArray(existing.routeOrder) && (existing.routeOrder as string[]).length > 0) {
      const existingRouteOrder = existing.routeOrder as string[];
      const existingOrderIds = new Set(existingRouteOrder);
      const currentOrderIds = new Set(orders.map(o => o.id));
      
      // If orders haven't changed, return existing schedule without re-optimizing
      if (existingOrderIds.size === currentOrderIds.size && 
          [...existingOrderIds].every(id => currentOrderIds.has(id))) {
        const existingLabels = existingRouteOrder.map((workOrderId) => {
          const order = orders.find(o => o.id === workOrderId);
          if (!order) return "?";
          return extractLocationLabel(order.customer?.address || "") || 
                 order.customer?.name?.charAt(0).toUpperCase() || 
                 "?";
        });
        
        return NextResponse.json({
          ok: true,
          schedule: existing,
          metrics: {
            totalDistance: existing.totalDistance ?? 0,
            totalFuelCost: existing.totalDistance ?? 0,
            totalDuration: existing.totalDuration ?? 0,
            totalTravelTime: 0,
            totalServiceTime: orders.length * serviceTimePerJob,
            routeOrder: existingRouteOrder,
            routeLabels: existingLabels,
            depotLabel: "Z",
          },
        });
      }
    }

    // Build nodes array: customers
    const customerNodes = orders.map((o, idx) => ({
      id: o.id,
      label: extractLocationLabel(o.customer?.address || "") || `C${idx + 1}`,
      scheduledDate: o.scheduledDate,
      priority: o.priority,
      orderIndex: idx,
    }));

    // Get route edges (fuel costs between locations)
    // Start with default/predefined edges structure
    const defaultEdges: Record<string, Record<string, number>> = {
      Z: { A: 50, B: 60, C: 70, D: 80, E: 90 },
      A: { Z: 50, B: 20, C: 40, D: 60, E: 80 },
      B: { Z: 60, A: 20, C: 30, D: 50, E: 70 },
      C: { Z: 70, A: 40, B: 30, D: 25, E: 50 },
      D: { Z: 80, A: 60, B: 50, C: 25, E: 30 },
      E: { Z: 90, A: 80, B: 70, C: 50, D: 30 },
    };
    
    // Automatically generate edges for any additional locations (F, G, H, etc.)
    const allLabels = new Set([depotLabel]);
    customerNodes.forEach(node => allLabels.add(node.label));
    
    allLabels.forEach(label => {
      if (!defaultEdges[label]) {
        defaultEdges[label] = {};
      }
      allLabels.forEach(otherLabel => {
        if (label !== otherLabel && !defaultEdges[label][otherLabel]) {
          // Generate symmetric edge
          const cost = generateDefaultFuelCost(label, otherLabel);
          defaultEdges[label][otherLabel] = cost;
        }
      });
    });
    
    const edges = defaultEdges;

    // Add depot as node (index will be nodes.length)
    const depotIndex = customerNodes.length;
    const nodes = [
      ...customerNodes,
      {
        id: `DEPOT_${technicianId}`,
        label: depotLabel,
        scheduledDate: null,
        priority: null,
        orderIndex: -1,
      },
    ];

    // Build cost matrix (fuel costs) - n+1 x n+1: customers + depot
    const n = nodes.length;
    const costMatrix: number[][] = Array(n)
      .fill(null)
      .map(() => Array(n).fill(Infinity));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          costMatrix[i][j] = 0;
          continue;
        }
        const nodeI = nodes[i];
        const nodeJ = nodes[j];
        
        // Get fuel cost from edges
        costMatrix[i][j] = getFuelCost(nodeI.label, nodeJ.label, edges);
      }
    }

    // Solve TSP using fuel cost matrix
    const route = solveTSP(nodes, { label: depotLabel }, costMatrix, depotIndex);

    // Calculate route metrics
    let totalFuelCost = 0;
    const routeWithDepot = [depotIndex, ...route, depotIndex];
    for (let i = 0; i < routeWithDepot.length - 1; i++) {
      totalFuelCost += costMatrix[routeWithDepot[i]][routeWithDepot[i + 1]];
    }
    
    // Estimate distance from fuel cost (assume 1 fuel unit ≈ 1 km, adjust if needed)
    const totalDistance = totalFuelCost; // Fuel cost is already the distance/cost metric
    const totalTravelTime = (totalDistance / 50) * 60; // Assume 50 km/h average speed, convert to minutes
    const totalServiceTime = orders.length * serviceTimePerJob;
    const totalDuration = totalTravelTime + totalServiceTime;

    // Map route indices back to work order IDs
    const routeOrder = route.map((idx) => orders[idx].id);

    // If scheduled dates exist, prioritize them but keep optimized order where possible
    const withScheduledDates = orders
      .map((o, idx) => ({ o, originalIdx: idx, routeIdx: route.indexOf(idx) }))
      .sort((a, b) => {
        const aDate = a.o.scheduledDate?.getTime() ?? Infinity;
        const bDate = b.o.scheduledDate?.getTime() ?? Infinity;
        if (aDate !== bDate) return aDate - bDate;
        return a.routeIdx - b.routeIdx;
      });
    
    // Use optimized route if no scheduled dates, otherwise respect scheduled dates
    const finalRouteOrder = withScheduledDates.every((w) => !w.o.scheduledDate)
      ? routeOrder
      : withScheduledDates.map((w) => w.o.id);

    const saved = existing
      ? await prisma.technicianSchedule.update({
          where: { id: existing.id },
          data: {
            routeOrder: finalRouteOrder,
            totalDistance: Math.round(totalDistance * 100) / 100,
            totalDuration: Math.round(totalDuration),
          },
        })
      : await prisma.technicianSchedule.create({
          data: {
            technicianId,
            date: new Date(toISODate(dayStart)),
            routeOrder: finalRouteOrder,
            totalDistance: Math.round(totalDistance * 100) / 100,
            totalDuration: Math.round(totalDuration),
          },
        });

    // Get route labels for visualization - match finalRouteOrder
    const orderMap = new Map(orders.map((o, idx) => [o.id, { order: o, originalIdx: idx }]));
    const routeLabels = finalRouteOrder.map((workOrderId) => {
      const orderData = orderMap.get(workOrderId);
      if (!orderData) return "?";
      const order = orderData.order;
      const label = extractLocationLabel(order.customer?.address || "") || 
                   order.customer?.name?.charAt(0).toUpperCase() || 
                   `C${orderData.originalIdx + 1}`;
      return label;
    });

    return NextResponse.json({
      ok: true,
      schedule: saved,
      metrics: {
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalFuelCost: Math.round(totalFuelCost * 100) / 100,
        totalDuration: Math.round(totalDuration),
        totalTravelTime: Math.round(totalTravelTime),
        totalServiceTime,
        routeOrder: finalRouteOrder,
        routeLabels, // Labels in optimized order
        depotLabel,
      },
    });
  } catch (error: any) {
    console.error("Route optimization error:", error);
    return NextResponse.json(
      { error: "Failed to optimize route", detail: error?.message },
      { status: 500 }
    );
  }
}


