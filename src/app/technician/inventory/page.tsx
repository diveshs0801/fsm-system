"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";

type InventoryItem = { id: string; name: string; unitPrice: number; quantity?: number };

export default function TechnicianInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  async function load() {
    const inv = await fetch("/api/inventory").then((r) => r.json());
    setInventory(inv);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="technician" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="Inventory" crumbs={[{ label: "Technician", href: "/technician" }, { label: "Inventory" }]} right={<Button variant="secondary" onClick={load}>Refresh</Button>} />
        <div className="bg-white border rounded-lg p-4">
          <div className="grid md:grid-cols-3 gap-2 text-sm">
            {inventory.map((i) => (
              <div key={i.id} className="border rounded px-3 py-2 bg-gray-50 flex justify-between">
                <span>{i.name}</span>
                <span className="text-gray-500">₹{i.unitPrice.toFixed(2)} · Stock: {i.quantity ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}


