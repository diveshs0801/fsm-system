"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";
import { WorkOrderCard, type WorkOrderCardData } from "@/components/WorkOrderCard";

type WorkOrderStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export default function TechnicianJobsPage() {
  const params = useParams();
  const technicianId = (params?.id as string) ?? "";
  const [orders, setOrders] = useState<WorkOrderCardData[]>([]);
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!technicianId || technicianId.trim() === "") {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Get technician name
      const dashboardResponse = await fetch(`/api/technician-dashboard?technicianId=${encodeURIComponent(technicianId)}`);
      if (dashboardResponse.ok) {
        const dashboard = await dashboardResponse.json();
        setName(dashboard.technician?.name ?? technicianId);
      }

      // Ensure we have an up-to-date route for today
      await fetch(`/api/optimize-route`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId }) });
      
      const [wo, schedule] = await Promise.all([
        fetch("/api/workorders").then((r) => r.json()),
        fetch(`/api/optimize-route`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId }) }).then((r) => r.json()),
      ]);
      const order: string[] = schedule?.schedule?.routeOrder ?? [];
      const woById: Record<string, any> = Object.fromEntries(wo.filter((w: any) => w.technicianId === technicianId).map((w: any) => [w.id, w]));
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
    } catch (err) {
      console.error("Error loading jobs:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (technicianId) {
      load(); 
    }
  }, [technicianId]);

  async function setStatus(id: string, status: WorkOrderStatus) {
    await fetch(`/api/workorders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    await load();
  }

  async function markPaid(id: string) {
    await fetch(`/api/workorders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ billingStatus: "PAID" }) });
    await load();
  }

  const baseHref = technicianId ? `/technician/${technicianId}` : "/technician";

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="technician" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader 
          title="My Jobs" 
          crumbs={[{ label: "Technician", href: baseHref }, { label: name || "Jobs" }]} 
          right={<Button variant="secondary" onClick={load}>Refresh</Button>} 
        />
        {loading ? (
          <div className="text-center text-gray-500">Loading jobs...</div>
        ) : (
          <div className="grid gap-3">
            {orders.length === 0 ? (
              <div className="text-sm text-gray-500">No assigned work orders for today.</div>
            ) : (
              orders.map((o) => (
                <WorkOrderCard 
                  key={o.id} 
                  data={o} 
                  onStart={(id) => setStatus(id, "IN_PROGRESS")} 
                  onComplete={(id) => setStatus(id, "COMPLETED")} 
                  onMarkPaid={(id) => markPaid(id)} 
                />
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

