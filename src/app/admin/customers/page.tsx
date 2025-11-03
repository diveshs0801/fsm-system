"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";

type Customer = { id: string; name: string; address?: string; phone?: string; email?: string; complaintDescription?: string; complaintType?: "AC" | "FAN" | "CYLINDER" };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<{ name: string; address: string; phone?: string; email?: string; complaintDescription?: string; complaintType?: "AC" | "FAN" | "CYLINDER" }>({ name: "", address: "", phone: "", email: "", complaintDescription: "", complaintType: "AC" });
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const cs = await fetch("/api/customers").then((r) => r.json());
      setCustomers(cs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createCustomer(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ name: "", address: "", phone: "", email: "" });
    await load();
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="Customers" crumbs={[{ label: "Admin", href: "/admin" }, { label: "Customers" }]} right={<Button variant="secondary" onClick={load}>Refresh</Button>} />
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Add Customer</h2>
          <form onSubmit={createCustomer} className="grid md:grid-cols-2 gap-2 mb-3">
            <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
            <input className="border rounded px-3 py-2" placeholder="Address" value={form.address} onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))} required />
            <input className="border rounded px-3 py-2" placeholder="Phone" value={form.phone ?? ""} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} />
            <input className="border rounded px-3 py-2" placeholder="Email" value={form.email ?? ""} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} />
            <textarea className="border rounded px-3 py-2 md:col-span-2" placeholder="Complaint Description" value={form.complaintDescription ?? ""} onChange={(e) => setForm((s) => ({ ...s, complaintDescription: e.target.value }))} />
            <select className="border rounded px-3 py-2" value={form.complaintType ?? "AC"} onChange={(e) => setForm((s) => ({ ...s, complaintType: e.target.value as any }))}>
              {["AC","FAN","CYLINDER"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="md:col-span-2 flex justify-end"><Button type="submit">Add Customer</Button></div>
          </form>
          {loading ? <div className="text-sm text-gray-500">Loading...</div> : (
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              {customers.map((c) => (
                <div key={c.id} className="border rounded px-3 py-2 bg-gray-50">
                  <div className="flex justify-between"><span className="font-medium">{c.name}</span><span className="text-gray-500">{c.address}</span></div>
                  <div className="text-xs text-gray-600">Type: {c.complaintType ?? "-"}</div>
                  <div className="text-xs text-gray-600 truncate">{c.complaintDescription}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


