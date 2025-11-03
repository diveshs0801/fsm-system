"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type WorkOrderStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type PriorityLevel = "LOW" | "MEDIUM" | "HIGH";

export type WorkOrderRow = {
  id: string;
  title: string;
  customer?: { id: string; name: string } | null;
  technician?: { id: string; user?: { name: string } | null } | null;
  status: WorkOrderStatus;
  priority: PriorityLevel;
  scheduledDate?: string | null;
  billingStatus?: "PENDING" | "PAID" | "CANCELLED";
  items?: { name: string; quantity: number; unitPrice?: number }[];
  totalAmount?: number;
};

type Props = {
  rows: WorkOrderRow[];
  onAssign?: (id: string, technicianId: string) => void;
  technicians?: { id: string; name: string }[];
};

export function WorkOrderTable({ rows, onAssign, technicians }: Props) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Assign</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">{r.title}</td>
              <td className="px-4 py-2">{r.customer?.name ?? "-"}</td>
              <td className="px-4 py-2">{r.technician?.user?.name ?? "Unassigned"}</td>
              <td className="px-4 py-2">
                <Badge color={r.status === "COMPLETED" ? "green" : r.status === "IN_PROGRESS" ? "blue" : r.status === "SCHEDULED" ? "yellow" : "gray"}>{r.status}</Badge>
              </td>
              <td className="px-4 py-2">
                <Badge color={r.priority === "HIGH" ? "red" : r.priority === "MEDIUM" ? "yellow" : "gray"}>{r.priority}</Badge>
              </td>
              <td className="px-4 py-2">{r.scheduledDate ? new Date(r.scheduledDate).toLocaleString() : "-"}</td>
              <td className="px-4 py-2 text-xs text-gray-700 max-w-[260px] truncate">
                {r.items && r.items.length > 0 ? r.items.map((it) => `${it.name} x${it.quantity}`).join(", ") : "-"}
              </td>
              <td className="px-4 py-2">{r.totalAmount !== undefined ? `₹${r.totalAmount.toFixed(2)}` : "-"}</td>
              <td className="px-4 py-2">
                <Badge color={r.billingStatus === "PAID" ? "green" : r.billingStatus === "CANCELLED" ? "red" : "gray"}>{r.billingStatus ?? "PENDING"}</Badge>
              </td>
              <td className="px-4 py-2">
                <div className="flex gap-2 justify-end">
                  {onAssign && (
                    <select
                      className="border rounded px-3 py-2 text-sm"
                      value={r.technician?.id ?? ""}
                      onChange={(e) => onAssign(r.id, e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {(technicians ?? []).map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


