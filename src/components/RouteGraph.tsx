"use client";

import React from "react";

type Node = { id: string; label: string; x: number; y: number };
type Edge = { from: string; to: string; cost: number; isOptimized?: boolean };

type RouteGraphProps = {
  nodes: Node[];
  edges: Edge[];
  optimizedRoute: string[]; // Array of node labels in order
  depotLabel: string;
};

export function RouteGraph({ nodes, edges, optimizedRoute, depotLabel }: RouteGraphProps) {
  const nodeMap = new Map(nodes.map((n) => [n.label, n]));
  const optimizedEdges = new Set<string>();
  
  // Mark edges that are in the optimized route
  for (let i = 0; i < optimizedRoute.length + 1; i++) {
    const from = i === 0 ? depotLabel : optimizedRoute[i - 1];
    const to = i === optimizedRoute.length ? depotLabel : optimizedRoute[i];
    optimizedEdges.add(`${from}-${to}`);
    optimizedEdges.add(`${to}-${from}`); // Bidirectional
  }

  // Calculate total optimized cost
  let optimizedCost = 0;
  for (let i = 0; i < optimizedRoute.length + 1; i++) {
    const from = i === 0 ? depotLabel : optimizedRoute[i - 1];
    const to = i === optimizedRoute.length ? depotLabel : optimizedRoute[i];
    const edge = edges.find((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from));
    if (edge) optimizedCost += edge.cost;
  }

  // Calculate naive route cost (just visiting in order)
  let naiveCost = 0;
  if (optimizedRoute.length > 0) {
    const naiveRoute = [...optimizedRoute].sort(); // Alphabetical order
    for (let i = 0; i < naiveRoute.length + 1; i++) {
      const from = i === 0 ? depotLabel : naiveRoute[i - 1];
      const to = i === naiveRoute.length ? depotLabel : naiveRoute[i];
      const edge = edges.find((e) => (e.from === from && e.to === to) || (e.from === to && e.to === from));
      if (edge) naiveCost += edge.cost;
    }
  }

  const savings = naiveCost - optimizedCost;
  const savingsPercent = naiveCost > 0 ? ((savings / naiveCost) * 100).toFixed(1) : "0";

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Route Optimization Analysis</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <div className="text-xs text-green-700 mb-1">Optimized Fuel Cost</div>
            <div className="text-xl font-bold text-green-900">{optimizedCost.toFixed(0)}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <div className="text-xs text-red-700 mb-1">Naive Route Cost</div>
            <div className="text-xl font-bold text-red-900">{naiveCost.toFixed(0)}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <div className="text-xs text-blue-700 mb-1">Savings</div>
            <div className="text-xl font-bold text-blue-900">
              {savings.toFixed(0)} ({savingsPercent}%)
            </div>
          </div>
        </div>
      </div>

      <div className="relative border rounded-lg bg-gray-50 p-4" style={{ minHeight: "450px" }}>
        <svg width="100%" height="450" viewBox="0 0 400 450" className="w-full">
          {/* Draw all edges first (non-optimized in light gray) */}
          {edges.map((edge, idx) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;
            
            const isOptimized = optimizedEdges.has(`${edge.from}-${edge.to}`);
            
            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isOptimized ? "#3b82f6" : "#94a3b8"}
                  strokeWidth={isOptimized ? 3 : 2}
                  strokeDasharray={isOptimized ? "0" : "5,5"}
                  opacity={isOptimized ? 1 : 0.6}
                />
                {/* Cost label */}
                <text
                  x={(fromNode.x + toNode.x) / 2}
                  y={(fromNode.y + toNode.y) / 2 - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isOptimized ? "#1e40af" : "#475569"}
                  fontWeight={isOptimized ? "bold" : "normal"}
                  className="pointer-events-none"
                >
                  {edge.cost}
                </text>
              </g>
            );
          })}
          
          {/* Draw nodes */}
          {nodes.map((node) => {
            const isDepot = node.label === depotLabel;
            const isOptimized = optimizedRoute.includes(node.label) || isDepot;
            const routeIndex = isDepot ? 0 : optimizedRoute.indexOf(node.label) + 1;
            
            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isDepot ? 20 : 18}
                  fill={isDepot ? "#f59e0b" : isOptimized ? "#3b82f6" : "#9ca3af"}
                  stroke="#fff"
                  strokeWidth={3}
                  className="cursor-pointer"
                />
                <text
                  x={node.x}
                  y={node.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="14"
                  fontWeight="bold"
                  className="pointer-events-none select-none"
                >
                  {node.label}
                </text>
                {isOptimized && !isDepot && (
                  <text
                    x={node.x}
                    y={node.y + 30}
                    textAnchor="middle"
                    fontSize="11"
                    fill="#1e40af"
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    #{routeIndex}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white border rounded p-3 shadow-sm text-xs">
          <div className="font-semibold mb-2">Legend</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500"></div>
              <span>Depot (Z)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span>Optimized Route</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <span>Other Locations</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-8 h-0.5 bg-blue-500"></div>
              <span>Optimized Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-slate-400 border-dashed"></div>
              <span>Available Path</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="text-sm font-semibold text-blue-900 mb-1">Optimized Route Sequence:</div>
        <div className="text-xs text-blue-700">
          <span className="font-bold">Z</span> → {optimizedRoute.map((label, idx) => (
            <React.Fragment key={idx}>
              <span className="font-bold">{label}</span>
              {idx < optimizedRoute.length - 1 ? " → " : ""}
            </React.Fragment>
          ))} → <span className="font-bold">Z</span>
        </div>
      </div>
    </div>
  );
}

