"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";

type InventoryItem = { id: string; name: string; unitPrice: number; quantity?: number };

export default function TechnicianInventoryPage() {
  const params = useParams();
  const technicianId = (params?.id as string) ?? "";
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  async function load() {
    const [inv, usage] = await Promise.all([
      fetch("/api/inventory").then((r) => r.json()),
      technicianId ? fetch(`/api/inventory/usage?technicianId=${encodeURIComponent(technicianId)}`).then((r) => r.json()) : Promise.resolve([]),
    ]);
    // If usage exists, merge usedCount into items; else just show stock
    const usedById: Record<string, number> = Object.fromEntries((usage as any[]).map((u: any) => [u.id, u.usedCount ?? 0]));
    const merged: InventoryItem[] = (inv as any[])
      .map((i: any) => ({ ...i, usedCount: usedById[i.id] ?? 0 }))
      .filter((i: any) => (technicianId ? (usedById[i.id] ?? 0) > 0 : true));
    setInventory(merged as any);
  }
  
  useEffect(() => { load(); }, []);

  const baseHref = technicianId ? `/technician/${technicianId}` : "/technician";

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="technician" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="Inventory" crumbs={[{ label: "Technician", href: baseHref }, { label: "Inventory" }]} right={<Button variant="secondary" onClick={load}>Refresh</Button>} />
        <div className="bg-white border rounded-lg p-4">
          <div className="grid md:grid-cols-3 gap-2 text-sm">
            {inventory.map((i: any) => (
              <div key={i.id} className="border rounded px-3 py-2 bg-gray-50 flex justify-between">
                <span>{i.name}</span>
                <span className="text-gray-500">₹{i.unitPrice.toFixed(2)} · Used: {i.usedCount ?? 0} · Stock: {i.quantity ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

