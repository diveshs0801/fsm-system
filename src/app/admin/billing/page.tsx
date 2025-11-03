"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/Button";
import PageHeader from "@/components/PageHeader";

export default function AdminBillingPage() {
  const [billing, setBilling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const bl = await fetch("/api/billing").then((r) => r.json());
      setBilling(bl);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar variant="admin" />
      <main className="flex-1 p-6 space-y-6">
        <PageHeader title="Billing" crumbs={[{ label: "Admin", href: "/admin" }, { label: "Billing" }]} right={<Button variant="secondary" onClick={load}>Refresh</Button>} />
        <div className="bg-white border rounded-lg p-4">
          {loading ? <div className="text-sm text-gray-500">Loading...</div> : (
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Invoice</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Work Order</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Customer</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Amount</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {billing.map((b: any) => (
                    <tr key={b.id}>
                      <td className="px-3 py-2 text-sm">{b.invoiceNumber ?? "-"}</td>
                      <td className="px-3 py-2 text-sm">{b.workOrder?.title}</td>
                      <td className="px-3 py-2 text-sm">{b.workOrder?.customer?.name}</td>
                      <td className="px-3 py-2 text-sm">₹{(b.totalAmount ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-sm">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


