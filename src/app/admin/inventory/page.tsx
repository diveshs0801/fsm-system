"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<{ id: string; name: string; sku?: string; quantity: number; unitPrice: number }[]>([]);
  const [form, setForm] = useState<{ name: string; sku?: string; quantity: number; unitPrice: number }>({ name: "", sku: "", quantity: 0, unitPrice: 0 });

  async function load() {
    const inv = await fetch("/api/inventory").then((r) => r.json());
    setInventory(inv);
  }
  useEffect(() => { load(); }, []);

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", sku: "", quantity: 0, unitPrice: 0 });
    await load();
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="Inventory" crumbs={[{ label: "Admin", href: "/admin" }, { label: "Inventory" }]} right={<Button variant="secondary" onClick={load}>Refresh</Button>} />
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Add Item</h2>
          <form onSubmit={createItem} className="grid md:grid-cols-4 gap-2 mb-3">
            <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
            <input className="border rounded px-3 py-2" placeholder="SKU" value={form.sku ?? ""} onChange={(e) => setForm((s) => ({ ...s, sku: e.target.value }))} />
            <input className="border rounded px-3 py-2" type="number" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
            <input className="border rounded px-3 py-2" type="number" placeholder="Unit Price" value={form.unitPrice} onChange={(e) => setForm((s) => ({ ...s, unitPrice: Number(e.target.value) }))} required />
            <div className="md:col-span-4 flex justify-end"><Button type="submit">Add Item</Button></div>
          </form>
          <div className="grid md:grid-cols-3 gap-2 text-sm">
            {inventory.map((i) => (
              <div key={i.id} className="border rounded px-3 py-2 bg-gray-50 flex justify-between w-full"><span>{i.name}</span><span className="text-gray-500">₹{i.unitPrice.toFixed(2)}</span></div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}


