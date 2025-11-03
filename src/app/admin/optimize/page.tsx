"use client";

import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";
import { RouteGraph } from "@/components/RouteGraph";

type Technician = { id: string; user: { name: string } };

function TechnicianRoute({ technicianId, technicianName }: { technicianId: string; technicianName: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  async function load() {
    setLoading(true);
    try {
      const [schedule, edgesRes] = await Promise.all([
        fetch(`/api/optimize-route`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId }) }).then((r) => r.json()),
        fetch(`/api/route-edges`).then((r) => r.json()).catch(() => ({ edges: {} })),
      ]);
      
      // Extract location labels and build graph data
      if (schedule?.metrics) {
        // Use route labels from API if available, otherwise extract from items
        const labels = schedule.metrics.routeLabels || [];
        
        // Build nodes for graph visualization - include all possible nodes from edges
        const allPossibleLabels = new Set(["Z"]);
        labels.forEach((l: string) => allPossibleLabels.add(l));
        if (edgesRes.edges) {
          Object.keys(edgesRes.edges).forEach((key) => allPossibleLabels.add(key));
          Object.values(edgesRes.edges).forEach((toMap: any) => {
            if (toMap) Object.keys(toMap).forEach((key) => allPossibleLabels.add(key));
          });
        }
        const allLabels = Array.from(allPossibleLabels);
        const routeEdges = edgesRes.edges || {};
        const graphEdges: Array<{ from: string; to: string; cost: number }> = [];
        
        // Collect all edges
        Object.entries(routeEdges).forEach(([from, toMap]: [string, any]) => {
          Object.entries(toMap).forEach(([to, cost]: [string, any]) => {
            graphEdges.push({ from, to, cost });
          });
        });
        
        // Position nodes in a circular layout
        const centerX = 200;
        const centerY = 200;
        const radius = allLabels.length <= 5 ? 100 : 120;
        const nodes = allLabels.map((label, idx) => {
          const angle = (idx * 2 * Math.PI) / allLabels.length - Math.PI / 2;
          return {
            id: `node-${label}`,
            label,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          };
        });
        
        setGraphData({
          nodes,
          edges: graphEdges,
          optimizedRoute: labels,
          depotLabel: schedule.metrics.depotLabel || "Z",
          metrics: schedule.metrics,
        });
      }
    } catch (err) {
      console.error("Error loading route:", err);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => { load(); }, [technicianId]);
  
  return (
    <div className="space-y-4">
      <div className="border rounded p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">{technicianName}</h3>
          <Button variant="secondary" onClick={load} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
        
        {graphData && (
          <div className="mb-4">
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="bg-white rounded p-2 border">
                <div className="text-xs text-gray-600">Total Fuel Cost</div>
                <div className="text-lg font-bold">{graphData.metrics.totalFuelCost?.toFixed(0) || 0}</div>
              </div>
              <div className="bg-white rounded p-2 border">
                <div className="text-xs text-gray-600">Total Distance</div>
                <div className="text-lg font-bold">{graphData.metrics.totalDistance?.toFixed(0) || 0}</div>
              </div>
              <div className="bg-white rounded p-2 border">
                <div className="text-xs text-gray-600">Total Duration</div>
                <div className="text-lg font-bold">{graphData.metrics.totalDuration?.toFixed(0) || 0} min</div>
              </div>
              <div className="bg-white rounded p-2 border">
                <div className="text-xs text-gray-600">Service Time</div>
                <div className="text-lg font-bold">{graphData.metrics.totalServiceTime || 0} min</div>
              </div>
            </div>
          </div>
        )}
        
        {graphData?.optimizedRoute?.length ? (
          <div className="mt-2 text-sm">
            <div className="text-gray-700">Route sequence:</div>
            <div className="font-semibold">Z → {graphData.optimizedRoute.join(" → ")} → Z</div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-500">No route generated.</div>
        )}
      </div>
      
      {graphData && graphData.nodes.length > 0 && (
        <RouteGraph
          nodes={graphData.nodes}
          edges={graphData.edges}
          optimizedRoute={graphData.optimizedRoute}
          depotLabel={graphData.depotLabel}
        />
      )}
    </div>
  );
}

export default function AdminOptimizePage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [commonGraphData, setCommonGraphData] = useState<any>(null);
  const techNameById = useMemo(() => Object.fromEntries(technicians.map((t) => [t.id, t.user.name])), [technicians]);

  async function load() {
    const [ts, edgesRes] = await Promise.all([
      fetch("/api/technicians").then((r) => r.json()),
      fetch(`/api/route-edges`).then((r) => r.json()).catch(() => ({ edges: {} })),
    ]);
    setTechnicians(ts);

    // Build a common graph from all edges
    const edges = edgesRes.edges || {};
    const labelSet = new Set<string>();
    Object.keys(edges).forEach((from) => {
      labelSet.add(from);
      Object.keys(edges[from] || {}).forEach((to) => labelSet.add(to));
    });
    if (!labelSet.has("Z")) labelSet.add("Z");

    const labels = Array.from(labelSet);
    const centerX = 200;
    const centerY = 200;
    const radius = labels.length <= 6 ? 100 : 130;

    const nodes = labels.map((label, idx) => {
      const angle = (idx * 2 * Math.PI) / labels.length - Math.PI / 2;
      return { id: `node-${label}`, label, x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
    });
    const graphEdges: Array<{ from: string; to: string; cost: number }> = [];
    Object.entries(edges).forEach(([from, toMap]: [string, any]) => {
      Object.entries(toMap || {}).forEach(([to, cost]: [string, any]) => {
        graphEdges.push({ from, to, cost });
      });
    });
    setCommonGraphData({ nodes, edges: graphEdges, optimizedRoute: [], depotLabel: "Z" });
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="Optimize Route" crumbs={[{ label: "Admin", href: "/admin" }, { label: "Optimize" }]} right={<Button variant="secondary" onClick={load}>Refresh</Button>} />
        {commonGraphData && (
          <div className="space-y-3">
            <div className="text-sm font-semibold">Network: All Routes & Costs</div>
            <RouteGraph
              nodes={commonGraphData.nodes}
              edges={commonGraphData.edges}
              optimizedRoute={[]}
              depotLabel={commonGraphData.depotLabel}
            />
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          {technicians.map((t) => (
            <TechnicianRoute key={t.id} technicianId={t.id} technicianName={techNameById[t.id]} />
          ))}
        </div>
      </main>
    </div>
  );
}


