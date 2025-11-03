"use client";

import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";
import { WorkOrderTable, type WorkOrderRow } from "@/components/WorkOrderTable";

type WorkOrderStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

type Customer = { id: string; name: string };
type Technician = { id: string; user: { name: string } };

export default function AdminWorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrderRow[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [inventory, setInventory] = useState<{ id: string; name: string; unitPrice: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState<{ name: string; address: string; phone?: string; email?: string }>({ name: "", address: "", phone: "", email: "" });
  const [form, setForm] = useState({
    title: "",
    description: "",
    customerId: "",
    scheduledDate: "",
    priority: "MEDIUM" as PriorityLevel,
    technicianId: "",
  });
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [serviceFee, setServiceFee] = useState<number>(0);

  async function loadAll() {
    setLoading(true);
    try {
      const [woRes, cRes, tRes, invRes] = await Promise.all([
        fetch("/api/workorders"),
        fetch("/api/customers"),
        fetch("/api/technicians"),
        fetch("/api/inventory"),
      ]);
      const [wo, cs, ts, inv] = await Promise.all([woRes.json(), cRes.json(), tRes.json(), invRes.json()]);
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
          items: (w.inventoryItems ?? []).map((wi: any) => ({ name: wi.inventoryItem?.name, quantity: wi.quantityUsed, unitPrice: wi.inventoryItem?.unitPrice })),
          totalAmount: w.billing?.totalAmount ?? undefined,
        }))
      );
      setCustomers(cs);
      setTechnicians(ts);
      setInventory(inv);
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
      let useCustomerId = form.customerId;
      if (createNewCustomer) {
        const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newCustomer) });
        const created = await res.json();
        useCustomerId = created.id;
      }
      const inventoryItems = Object.entries(selectedItems)
        .filter(([, qty]) => qty && qty > 0)
        .map(([inventoryId, quantityUsed]) => ({ inventoryId, quantityUsed }));
      await fetch("/api/workorders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          customerId: useCustomerId,
          scheduledDate: form.scheduledDate || undefined,
          priority: form.priority,
          technicianId: form.technicianId || undefined,
          inventoryItems,
          serviceFee,
        }),
      });
      setForm({ title: "", description: "", customerId: "", scheduledDate: "", priority: "MEDIUM", technicianId: "" });
      setNewCustomer({ name: "", address: "", phone: "", email: "" });
      setSelectedItems({});
      setServiceFee(0);
      await loadAll();
    } finally {
      setCreating(false);
    }
  }

  async function assignTechnician(workOrderId: string, techId: string) {
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

  async function markPaid(workOrderId: string) {
    await fetch(`/api/workorders/${workOrderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ billingStatus: "PAID" }) });
    await loadAll();
  }

  const totalPreview = useMemo(() => {
    const priceById: Record<string, number> = Object.fromEntries(inventory.map((i) => [i.id, i.unitPrice] as const));
    const itemsTotal = Object.entries(selectedItems).reduce((sum, [id, qty]) => sum + (priceById[id] ?? 0) * Math.max(0, qty || 0), 0);
    return itemsTotal + Math.max(0, serviceFee || 0);
  }, [selectedItems, inventory, serviceFee]);

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="Work Orders" crumbs={[{ label: "Admin", href: "/admin" }, { label: "Work Orders" }]} right={<Button variant="secondary" onClick={loadAll}>Refresh</Button>} />

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Create Work Order</h2>
          <form onSubmit={createWorkOrder} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input className="border rounded px-3 py-2" placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            <div className="flex items-center gap-2">
              <input id="new-cust" type="checkbox" className="h-4 w-4" checked={createNewCustomer} onChange={(e) => setCreateNewCustomer(e.target.checked)} />
              <label htmlFor="new-cust" className="text-sm text-gray-700">Create new customer</label>
            </div>
            {!createNewCustomer ? (
              <select className="border rounded px-3 py-2" value={form.customerId} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} required>
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-1 gap-2 md:col-span-1">
                <input className="border rounded px-3 py-2" placeholder="Customer Name" value={newCustomer.name} onChange={(e) => setNewCustomer((s) => ({ ...s, name: e.target.value }))} required />
                <input className="border rounded px-3 py-2" placeholder="Address" value={newCustomer.address} onChange={(e) => setNewCustomer((s) => ({ ...s, address: e.target.value }))} required />
              </div>
            )}
            <textarea className="border rounded px-3 py-2 md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <input type="datetime-local" className="border rounded px-3 py-2" value={form.scheduledDate} onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))} />
            <select className="border rounded px-3 py-2" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as PriorityLevel }))}>
              {["LOW","MEDIUM","HIGH"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <select className="border rounded px-3 py-2 md:col-span-2" value={form.technicianId} onChange={(e) => setForm((f) => ({ ...f, technicianId: e.target.value }))}>
              <option value="">Assign Technician (optional)</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>{t.user.name}</option>
              ))}
            </select>
            <div className="md:col-span-2 border rounded p-3 bg-gray-50">
              <div className="font-medium mb-2">Inventory Items</div>
              <div className="grid md:grid-cols-2 gap-2">
                {inventory.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-2 border rounded px-2 py-1 bg-white">
                    <div className="text-sm">
                      <div>{it.name}</div>
                      <div className="text-gray-500 text-xs">₹{it.unitPrice.toFixed(2)}</div>
                    </div>
                    <input type="number" min={0} className="w-20 border rounded px-2 py-1 text-sm" value={selectedItems[it.id] ?? 0} onChange={(e) => setSelectedItems((s) => ({ ...s, [it.id]: Number(e.target.value) }))} />
                  </div>
                ))}
              </div>
              <div className="mt-3 grid md:grid-cols-2 gap-2 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Service Fee</label>
                  <input type="number" min={0} className="w-32 border rounded px-2 py-1 text-sm" value={serviceFee} onChange={(e) => setServiceFee(Number(e.target.value || 0))} />
                </div>
                <div className="text-sm flex items-center justify-end gap-2">
                  <span className="text-gray-600">Estimated Total</span>
                  <span className="font-semibold">₹{totalPreview.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create Work Order"}</Button>
            </div>
          </form>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">All Work Orders</h2>
          </div>
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : (
            <WorkOrderTable rows={workOrders} onAssign={assignTechnician} technicians={technicians.map((t) => ({ id: t.id, name: t.user.name }))} />
          )}
        </div>
      </main>
    </div>
  );
}


