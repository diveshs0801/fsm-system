"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";
import { WorkOrderCard, type WorkOrderCardData } from "@/components/WorkOrderCard";

type WorkOrderStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export default function TechnicianByIdPage({ params }: { params: { id: string } }) {
  const technicianId = params.id;
  const [orders, setOrders] = useState<WorkOrderCardData[]>([]);
  const [name, setName] = useState<string>("");

  async function load() {
    const [tech, wo, schedule] = await Promise.all([
      fetch(`/api/technicians`).then((r) => r.json()),
      fetch(`/api/workorders`).then((r) => r.json()),
      fetch(`/api/optimize-route`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId }) }).then((r) => r.json()),
    ]);
    const t = (tech as any[]).find((x) => x.id === technicianId);
    setName(t?.user?.name ?? technicianId);
    const order: string[] = schedule?.schedule?.routeOrder ?? [];
    const woById: Record<string, any> = Object.fromEntries((wo as any[]).filter((w: any) => w.technicianId === technicianId).map((w: any) => [w.id, w]));
    const ordered = order.map((id) => woById[id]).filter(Boolean);
    const cards: WorkOrderCardData[] = ordered.map((w: any) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      status: w.status,
      customer: w.customer ? { id: w.customer.id, name: w.customer.name, address: w.customer.address } : undefined,
      billingStatus: w.billing?.status ?? "PENDING",
    }));
    setOrders(cards);
  }

  useEffect(() => { load(); }, [technicianId]);

  async function setStatus(id: string, status: WorkOrderStatus) {
    await fetch(`/api/workorders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
  }

  async function markPaid(id: string) {
    await fetch(`/api/workorders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ billingStatus: "PAID" }) });
    await load();
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="technician" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title={`Technician: ${name}`} crumbs={[{ label: "Technician", href: "/technician" }, { label: name }]} right={<Button variant="secondary" onClick={load}>Refresh</Button>} />
        <div className="grid gap-3">
          {orders.length === 0 ? (
            <div className="text-sm text-gray-500">No assigned work orders.</div>
          ) : (
            orders.map((o) => (
              <WorkOrderCard key={o.id} data={o} onStart={(id) => setStatus(id, "IN_PROGRESS")} onComplete={(id) => setStatus(id, "COMPLETED")} onMarkPaid={(id) => markPaid(id)} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}


