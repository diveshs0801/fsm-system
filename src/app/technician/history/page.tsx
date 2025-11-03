"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";

type Technician = { id: string; user: { name: string } };

export default function TechnicianHistoryPage() {
  const [technician, setTechnician] = useState<Technician | null>(null);
  const [completed, setCompleted] = useState<any[]>([]);

  async function load() {
    const techs: Technician[] = await fetch("/api/technicians").then((r) => r.json());
    const tech = techs[0] ?? null;
    setTechnician(tech);
    if (!tech) return;
    const wo = await fetch("/api/workorders").then((r) => r.json());
    setCompleted(wo.filter((w: any) => w.technicianId === tech.id && w.status === "COMPLETED"));
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="technician" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="History" crumbs={[{ label: "Technician", href: "/technician" }, { label: "History" }]} right={<Button variant="secondary" onClick={load}>Refresh</Button>} />
        <div className="bg-white border rounded-lg p-4">
          <div className="grid gap-2 text-sm">
            {completed.length === 0 ? (
              <div className="text-gray-500">No completed jobs yet.</div>
            ) : (
              completed.map((o: any) => (
                <div key={o.id} className="border rounded px-3 py-2 bg-gray-50 flex justify-between"><span>{o.title}</span><span className="text-gray-500">{o.customer?.name}</span></div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


