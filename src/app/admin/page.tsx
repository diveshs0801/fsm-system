"use client";

import React, { useEffect, useMemo, useState } from "react";
import { WorkOrderTable, type WorkOrderRow } from "@/components/WorkOrderTable";
import { Button } from "@/components/ui/Button";
import Sidebar from "@/components/Sidebar";

type WorkOrderStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

type Customer = { id: string; name: string; address?: string };
type Technician = { id: string; user: { name: string } };

export default function AdminPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [inventory, setInventory] = useState<{ id: string; name: string; unitPrice: number }[]>([]);
  const [billing, setBilling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    customerId: "",
    scheduledDate: "",
    priority: "MEDIUM" as PriorityLevel,
    technicianId: "",
  });
  const [newCustomer, setNewCustomer] = useState<{ name: string; address: string; phone?: string; email?: string }>({ name: "", address: "", phone: "", email: "" });
  const [newInventory, setNewInventory] = useState<{ name: string; sku?: string; quantity: number; unitPrice: number }>({ name: "", sku: "", quantity: 0, unitPrice: 0 });
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  async function loadAll() {
    setLoading(true);
    try {
      const [woRes, cRes, tRes, invRes, billRes] = await Promise.all([
        fetch("/api/workorders"),
        fetch("/api/customers"),
        fetch("/api/technicians"),
        fetch("/api/inventory"),
        fetch("/api/billing"),
      ]);
      const [wo, cs, ts, inv, bl] = await Promise.all([woRes.json(), cRes.json(), tRes.json(), invRes.json(), billRes.json()]);
      setWorkOrders(
        wo.map((w: any) => ({
          id: w.id,
          title: w.title,
          customer: w.customer ? { id: w.customer.id, name: w.customer.name } : null,
          technician: w.technician
            ? { id: w.technician.id, user: { name: w.technician.user?.name || "" } }
            : null,
          status: w.status,
          priority: w.priority,
          scheduledDate: w.scheduledDate ?? null,
          billingStatus: w.billing?.status ?? "PENDING",
        }))
      );
      setCustomers(cs);
      setTechnicians(ts);
      setInventory(inv);
      setBilling(bl);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function createWorkOrder(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const inventoryItems = Object.entries(selectedItems)
        .filter(([, qty]) => qty && qty > 0)
        .map(([inventoryId, quantityUsed]) => ({ inventoryId, quantityUsed }));
      await fetch("/api/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          customerId: form.customerId,
          scheduledDate: form.scheduledDate || undefined,
          priority: form.priority,
          technicianId: form.technicianId || undefined,
          inventoryItems,
        }),
      });
      setForm({ title: "", description: "", customerId: "", scheduledDate: "", priority: "MEDIUM", technicianId: "" });
      setSelectedItems({});
      await loadAll();
    } finally {
      setCreating(false);
    }
  }

  async function assignTechnician(workOrderId: string) {
    const techId = prompt("Enter Technician ID to assign:\n" + technicians.map((t) => `${t.user.name} (${t.id})`).join("\n"));
    if (!techId) return;
    await fetch(`/api/workorders/${workOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicianId: techId }),
    });
    await loadAll();
  }

  async function changeStatus(workOrderId: string, status: WorkOrderStatus) {
    await fetch(`/api/workorders/${workOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await loadAll();
  }

  async function optimizeForTechnician(technicianId: string) {
    await fetch(`/api/optimize-route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ technicianId }),
    });
    alert("Route optimized for technician.");
  }

  const techNameById = useMemo(() => Object.fromEntries(technicians.map((t) => [t.id, t.user.name])), [technicians]);
  const totalPreview = useMemo(() => {
    const priceById: Record<string, number> = Object.fromEntries(inventory.map((i) => [i.id, i.unitPrice] as const));
    return Object.entries(selectedItems).reduce((sum, [id, qty]) => sum + (priceById[id] ?? 0) * Math.max(0, qty || 0), 0);
  }, [selectedItems, inventory]);

  async function markPaid(workOrderId: string) {
    await fetch(`/api/workorders/${workOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ billingStatus: "PAID" }),
    });
    await loadAll();
  }

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newCustomer) });
    setNewCustomer({ name: "", address: "", phone: "", email: "" });
    await loadAll();
  }

  async function createInventoryItem(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newInventory) });
    setNewInventory({ name: "", sku: "", quantity: 0, unitPrice: 0 });
    await loadAll();
  }

  async function updateTechStatus(id: string, status: "AVAILABLE" | "BUSY" | "OFFLINE") {
    await fetch("/api/technician-status", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId: id, status }) });
    await loadAll();
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admin</h1>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Use the sidebar to navigate: Work Orders, Technicians, Customers, Inventory, Billing, Optimize.</p>
          <div className="mt-3"><a className="text-blue-600 underline" href="/admin/work-orders">Go to Work Orders →</a></div>
        </div>
      </main>
    </div>
  );
}

function TechnicianRoute({ technicianId, technicianName }: { technicianId: string; technicianName: string }) {
  const [route, setRoute] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  async function load() {
    const [schedule, orders] = await Promise.all([
      fetch(`/api/optimize-route`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId }) }).then((r) => r.json()),
      fetch(`/api/workorders`).then((r) => r.json()),
    ]);
    const order = schedule?.schedule?.routeOrder ?? [];
    setRoute(order);
    const map: Record<string, any> = Object.fromEntries(orders.map((o: any) => [o.id, o]));
    setItems(order.map((id: string) => map[id]).filter(Boolean));
  }
  useEffect(() => {
    load();
  }, []);
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


