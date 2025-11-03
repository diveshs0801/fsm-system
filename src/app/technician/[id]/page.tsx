"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";
import { WorkOrderCard, type WorkOrderCardData } from "@/components/WorkOrderCard";

type WorkOrderStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export default function TechnicianByIdPage() {
  const params = useParams();
  const technicianId = (params?.id as string) ?? "";
  const [orders, setOrders] = useState<WorkOrderCardData[]>([]);
  const [name, setName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!technicianId || technicianId.trim() === "") {
      setError("Technician ID is required");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use the technician-dashboard API which efficiently fetches technician data
      const dashboardResponse = await fetch(`/api/technician-dashboard?technicianId=${encodeURIComponent(technicianId)}`);
      
      if (!dashboardResponse.ok) {
        const errorData = await dashboardResponse.json().catch(() => ({ error: "Unknown error" }));
        console.error("Technician dashboard error:", errorData, "Status:", dashboardResponse.status);
        if (dashboardResponse.status === 404) {
          setError(`Technician not found (ID: ${technicianId})`);
          setLoading(false);
          return;
        }
        throw new Error(errorData.error || "Failed to load technician dashboard");
      }

      const dashboard = await dashboardResponse.json();
      if (!dashboard.technician) {
        setError(`Technician data not found (ID: ${technicianId})`);
        setLoading(false);
        return;
      }

      setName(dashboard.technician?.name ?? technicianId);

      // Ensure we have an up-to-date route for today
      await fetch(`/api/optimize-route`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId }) });

      // Get work orders with full details
      const workOrdersResponse = await fetch(`/api/workorders`);
      const allWorkOrders = await workOrdersResponse.json();
      
      // Filter work orders for this technician
      const technicianWorkOrders = (allWorkOrders as any[]).filter((w: any) => w.technicianId === technicianId);
      
      // Get optimized route order - use saved schedule if available, otherwise optimize
      const scheduleResponse = await fetch(`/api/optimize-route`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ technicianId }) 
      });
      const schedule = await scheduleResponse.json();
      
      // Use routeOrder from saved schedule (already optimized)
      const order: string[] = schedule?.schedule?.routeOrder ?? [];
      
      // Create a map of work orders by ID
      const woById: Record<string, any> = Object.fromEntries(
        technicianWorkOrders.map((w: any) => [w.id, w])
      );
      
      // Order work orders according to route order - preserve exact order from schedule
      const ordered = order.length > 0
        ? order.map((id) => woById[id]).filter(Boolean)
        : technicianWorkOrders;
      
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
      setError(err instanceof Error ? err.message : "Failed to load technician data");
      console.error("Error loading technician dashboard:", err);
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

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar variant="technician" />
        <main className="flex-1 p-6 space-y-6">
          <PageHeader title="Loading..." crumbs={[{ label: "Technician", href: "/technician" }]} />
          <div className="text-center text-gray-500">Loading technician dashboard...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar variant="technician" />
        <main className="flex-1 p-6 space-y-6">
          <PageHeader title="Error" crumbs={[{ label: "Technician", href: "/technician" }]} />
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
            <Button variant="secondary" onClick={load} className="mt-2">Retry</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="technician" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader 
          title={`Technician: ${name}`} 
          crumbs={[{ label: "Technician", href: "/technician" }, { label: name }]} 
          right={<Button variant="secondary" onClick={load}>Refresh</Button>} 
        />
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-sm text-gray-500">No assigned work orders.</div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">Optimized Route Order</p>
                <p className="text-xs text-blue-700">Follow this sequence to minimize fuel cost and service time:</p>
              </div>
              <div className="grid gap-3 pl-10">
                {orders.map((o, index) => (
                  <div key={o.id} className="relative">
                    <div className="absolute -left-10 top-4 flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold z-10">
                      {index + 1}
                    </div>
                    <WorkOrderCard 
                      data={o} 
                      onStart={(id) => setStatus(id, "IN_PROGRESS")} 
                      onComplete={(id) => setStatus(id, "COMPLETED")} 
                      onMarkPaid={(id) => markPaid(id)} 
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}


