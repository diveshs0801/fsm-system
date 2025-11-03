"use client";

import React, { useEffect, useMemo, useState } from "react";
import { WorkOrderCard, type WorkOrderCardData } from "@/components/WorkOrderCard";
import { Button } from "@/components/ui/Button";
import Sidebar from "@/components/Sidebar";

type WorkOrderStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

type Technician = { id: string; user: { name: string } };

export default function TechnicianPage() {
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [orders, setOrders] = useState<WorkOrderCardData[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, remaining: 0 });
  const [inventory, setInventory] = useState<{ id: string; name: string; unitPrice: number }[]>([]);
  const [statusForm, setStatusForm] = useState<{ status: "AVAILABLE" | "BUSY" | "OFFLINE"; lat?: string; lng?: string }>({ status: "AVAILABLE" });

  async function load() {
    const techs: Technician[] = await fetch("/api/technicians").then((r) => r.json());
    const tech = techs[0] ?? null;
    setTechnician(tech);
    if (!tech) return;

    // Ensure we have an up-to-date route for today
    await fetch(`/api/optimize-route`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId: tech.id }) });

    const [wo, schedule, inv] = await Promise.all([
      fetch("/api/workorders").then((r) => r.json()),
      fetch(`/api/optimize-route`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId: tech.id }) }).then((r) => r.json()),
      fetch("/api/inventory").then((r) => r.json()),
    ]);
    const order: string[] = schedule?.schedule?.routeOrder ?? [];
    const woById: Record<string, any> = Object.fromEntries(wo.filter((w: any) => w.technicianId === tech.id).map((w: any) => [w.id, w]));
    const ordered = order.map((id) => woById[id]).filter(Boolean);
    const cards: WorkOrderCardData[] = ordered.map((w: any) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      status: w.status,
      customer: w.customer ? { id: w.customer.id, name: w.customer.name, address: w.customer.address } : undefined,
      billingStatus: w.billing?.status ?? "PENDING",
    }));

    const total = cards.length;
    const completed = cards.filter((c) => c.status === "COMPLETED").length;
    const remaining = total - completed;
    setStats({ total, completed, remaining });
    setOrders(cards);
    setInventory(inv);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: WorkOrderStatus) {
    await fetch(`/api/workorders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
  }

  async function markPaid(id: string) {
    await fetch(`/api/workorders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ billingStatus: "PAID" }) });
    await load();
  }

  async function updateStatus() {
    if (!technician) return;
    await fetch("/api/technician-status", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId: technician.id, status: statusForm.status, lat: statusForm.lat ? Number(statusForm.lat) : undefined, lng: statusForm.lng ? Number(statusForm.lng) : undefined }) });
    await load();
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="technician" />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Technician</h1>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Use the sidebar to navigate: My Jobs, Inventory, History, Settings.</p>
          <div className="mt-3"><a className="text-blue-600 underline" href="/technician/jobs">Go to My Jobs →</a></div>
        </div>
      </main>
    </div>
  );
}


