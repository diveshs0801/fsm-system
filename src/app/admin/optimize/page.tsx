"use client";

import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";

type Technician = { id: string; user: { name: string } };

function TechnicianRoute({ technicianId, technicianName }: { technicianId: string; technicianName: string }) {
  const [items, setItems] = useState<any[]>([]);
  async function load() {
    const [schedule, orders] = await Promise.all([
      fetch(`/api/optimize-route`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId }) }).then((r) => r.json()),
      fetch(`/api/workorders`).then((r) => r.json()),
    ]);
    const order = schedule?.schedule?.routeOrder ?? [];
    const map: Record<string, any> = Object.fromEntries(orders.map((o: any) => [o.id, o]));
    setItems(order.map((id: string) => map[id]).filter(Boolean));
  }
  useEffect(() => { load(); }, []);
  return (
    <div className="border rounded p-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{technicianName}</h3>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>
      <ol className="mt-2 list-decimal list-inside space-y-1 text-sm">
        {items.length === 0 ? <span className="text-gray-500">No route generated.</span> : items.map((w: any) => (
          <li key={w.id}>{w.title} — {w.customer?.name}</li>
        ))}
      </ol>
    </div>
  );
}

export default function AdminOptimizePage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const techNameById = useMemo(() => Object.fromEntries(technicians.map((t) => [t.id, t.user.name])), [technicians]);

  async function load() {
    const ts = await fetch("/api/technicians").then((r) => r.json());
    setTechnicians(ts);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="Optimize Route" crumbs={[{ label: "Admin", href: "/admin" }, { label: "Optimize" }]} right={<Button variant="secondary" onClick={load}>Refresh</Button>} />
        <div className="grid md:grid-cols-2 gap-4">
          {technicians.map((t) => (
            <TechnicianRoute key={t.id} technicianId={t.id} technicianName={techNameById[t.id]} />
          ))}
        </div>
      </main>
    </div>
  );
}


