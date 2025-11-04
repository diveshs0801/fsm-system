"use client";

import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import PageHeader from "@/components/PageHeader";

type Technician = { id: string; user: { name: string }; currentStatus: "AVAILABLE" | "BUSY" | "OFFLINE" };

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
          {technicians.map((t) => {
            const getStatusColor = (status: "AVAILABLE" | "BUSY" | "OFFLINE"): "green" | "yellow" | "gray" => {
              if (status === "AVAILABLE") return "green";
              if (status === "BUSY") return "yellow";
              return "gray";
            };
            return (
              <div key={t.id} className="border rounded p-3 bg-white flex items-center justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {t.user.name}
                    <Badge color={getStatusColor(t.currentStatus)}>{t.currentStatus}</Badge>
                  </div>
                  <div className="text-xs text-gray-500">{t.id}</div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost"
                    onClick={() => updateTechStatus(t.id, "AVAILABLE")}
                    className={t.currentStatus === "AVAILABLE" 
                      ? "bg-green-500 hover:bg-green-600 text-white" 
                      : "hover:bg-green-100 hover:text-green-700"}
                  >
                    Available
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => updateTechStatus(t.id, "BUSY")}
                    className={t.currentStatus === "BUSY" 
                      ? "bg-yellow-500 hover:bg-yellow-600 text-white" 
                      : "hover:bg-yellow-100 hover:text-yellow-700"}
                  >
                    Busy
                  </Button>
                  <Button 
                    variant="ghost"
                    onClick={() => updateTechStatus(t.id, "OFFLINE")}
                    className={t.currentStatus === "OFFLINE" 
                      ? "bg-gray-700 hover:bg-gray-900 text-white" 
                      : "hover:bg-gray-200 hover:text-gray-900"}
                  >
                    Offline
                  </Button>
                  <Button onClick={() => optimizeForTechnician(t.id)}>Optimize</Button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}


