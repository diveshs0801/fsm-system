"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";

export default function TechnicianSettingsPage() {
  const params = useParams();
  const technicianId = (params?.id as string) ?? "";
  const [form, setForm] = useState<{ status: "AVAILABLE" | "BUSY" | "OFFLINE"; lat?: string; lng?: string }>({ status: "AVAILABLE" });
  const [name, setName] = useState<string>("");

  async function load() {
    if (!technicianId || technicianId.trim() === "") return;
    
    try {
      const dashboardResponse = await fetch(`/api/technician-dashboard?technicianId=${encodeURIComponent(technicianId)}`);
      if (dashboardResponse.ok) {
        const dashboard = await dashboardResponse.json();
        setName(dashboard.technician?.name ?? technicianId);
      }
    } catch (err) {
      console.error("Error loading technician:", err);
    }
  }
  
  useEffect(() => { 
    if (technicianId) {
      load(); 
    }
  }, [technicianId]);

  async function updateStatus() {
    if (!technicianId) return;
    await fetch("/api/technician-status", { 
      method: "PATCH", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ 
        technicianId, 
        status: form.status, 
        lat: form.lat ? Number(form.lat) : undefined, 
        lng: form.lng ? Number(form.lng) : undefined 
      }) 
    });
  }

  const baseHref = technicianId ? `/technician/${technicianId}` : "/technician";

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="technician" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="Settings" crumbs={[{ label: "Technician", href: baseHref }, { label: name || "Settings" }]} />
        <div className="bg-white border rounded-lg p-4">
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

