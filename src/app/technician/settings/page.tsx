"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import PageHeader from "@/components/PageHeader";

type Technician = { id: string; user: { name: string }; currentStatus: "AVAILABLE" | "BUSY" | "OFFLINE" };

export default function TechnicianSettingsPage() {
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [form, setForm] = useState<{ status: "AVAILABLE" | "BUSY" | "OFFLINE"; lat?: string; lng?: string }>({ status: "AVAILABLE" });

  async function load() {
    const techs: Technician[] = await fetch("/api/technicians").then((r) => r.json());
    const tech = techs[0] ?? null;
    setTechnician(tech);
    if (tech) {
      setForm((prev) => ({ ...prev, status: tech.currentStatus }));
    }
  }
  useEffect(() => { load(); }, []);

  async function updateStatus() {
    if (!technician) return;
    await fetch("/api/technician-status", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ technicianId: technician.id, status: form.status, lat: form.lat ? Number(form.lat) : undefined, lng: form.lng ? Number(form.lng) : undefined }) });
    await load();
  }

  const getStatusColor = (status: "AVAILABLE" | "BUSY" | "OFFLINE"): "green" | "yellow" | "gray" => {
    if (status === "AVAILABLE") return "green";
    if (status === "BUSY") return "yellow";
    return "gray";
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="technician" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="Settings" crumbs={[{ label: "Technician", href: "/technician" }, { label: "Settings" }]} />
        <div className="bg-white border rounded-lg p-4">
          {technician && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Current Status:</div>
              <Badge color={getStatusColor(technician.currentStatus)}>{technician.currentStatus}</Badge>
            </div>
          )}
          <div className="grid md:grid-cols-4 gap-2 items-end">
            <select className="border rounded px-3 py-2" value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value as any }))}>
              {["AVAILABLE","BUSY","OFFLINE"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="border rounded px-3 py-2" placeholder="Latitude" value={form.lat ?? ""} onChange={(e) => setForm((s) => ({ ...s, lat: e.target.value }))} />
            <input className="border rounded px-3 py-2" placeholder="Longitude" value={form.lng ?? ""} onChange={(e) => setForm((s) => ({ ...s, lng: e.target.value }))} />
            <div className="flex justify-end"><Button onClick={updateStatus}>Update</Button></div>
          </div>
        </div>
      </main>
    </div>
  );
}


