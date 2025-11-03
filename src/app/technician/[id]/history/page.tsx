"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";

export default function TechnicianHistoryPage() {
  const params = useParams();
  const technicianId = (params?.id as string) ?? "";
  const [completed, setCompleted] = useState<any[]>([]);
  const [name, setName] = useState<string>("");

  async function load() {
    if (!technicianId || technicianId.trim() === "") return;
    
    try {
      // Get technician name
      const dashboardResponse = await fetch(`/api/technician-dashboard?technicianId=${encodeURIComponent(technicianId)}`);
      if (dashboardResponse.ok) {
        const dashboard = await dashboardResponse.json();
        setName(dashboard.technician?.name ?? technicianId);
      }

      const wo = await fetch("/api/workorders").then((r) => r.json());
      setCompleted(wo.filter((w: any) => w.technicianId === technicianId && w.status === "COMPLETED"));
    } catch (err) {
      console.error("Error loading history:", err);
    }
  }
  
  useEffect(() => { 
    if (technicianId) {
      load(); 
    }
  }, [technicianId]);

  const baseHref = technicianId ? `/technician/${technicianId}` : "/technician";

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="technician" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="History" crumbs={[{ label: "Technician", href: baseHref }, { label: name || "History" }]} right={<Button variant="secondary" onClick={load}>Refresh</Button>} />
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

