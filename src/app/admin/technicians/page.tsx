"use client";

import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";

type Technician = { id: string; user: { name: string } };

export default function AdminTechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [form, setForm] = useState<{ name: string; specialty?: "AC" | "FAN" | "CYLINDER" }>({ name: "", specialty: "AC" });

  async function load() {
    const ts = await fetch("/api/technicians").then((r) => r.json());
    setTechnicians(ts);
  }
  useEffect(() => { load(); }, []);

  async function updateTechStatus(id: string, status: "AVAILABLE" | "BUSY" | "OFFLINE") {
    await fetch("/api/technician-status", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId: id, status }) });
    await load();
  }

  async function optimizeForTechnician(technicianId: string) {
    await fetch(`/api/optimize-route`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId }) });
    alert("Route optimized for technician.");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="Technicians" crumbs={[{ label: "Admin", href: "/admin" }, { label: "Technicians" }]} right={<Button variant="secondary" onClick={load}>Refresh</Button>} />

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Create Technician</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            await fetch("/api/technicians", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
            setForm({ name: "", specialty: "AC" });
            await load();
          }} className="grid md:grid-cols-3 gap-2 mb-3">
            <input className="border rounded px-3 py-2" placeholder="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
            <select className="border rounded px-3 py-2" value={form.specialty ?? "AC"} onChange={(e) => setForm((s) => ({ ...s, specialty: e.target.value as any }))}>
              {["AC","FAN","CYLINDER"].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="flex justify-end"><Button type="submit">Create</Button></div>
          </form>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {technicians.map((t) => (
            <div key={t.id} className="border rounded p-3 bg-white flex items-center justify-between">
              <div>
                <div className="font-semibold">{t.user.name}</div>
                <div className="text-xs text-gray-500">{t.id}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => updateTechStatus(t.id, "AVAILABLE")}>Available</Button>
                <Button variant="ghost" onClick={() => updateTechStatus(t.id, "BUSY")}>Busy</Button>
                <Button variant="ghost" onClick={() => updateTechStatus(t.id, "OFFLINE")}>Offline</Button>
                <Button onClick={() => optimizeForTechnician(t.id)}>Optimize</Button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}


