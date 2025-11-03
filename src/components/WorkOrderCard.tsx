"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type WorkOrderStatus = "PENDING" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type WorkOrderCardData = {
  id: string;
  title: string;
  description?: string | null;
  customer?: { id: string; name: string; address: string } | null;
  status: WorkOrderStatus;
  billingStatus?: "PENDING" | "PAID" | "CANCELLED";
};

type Props = {
  data: WorkOrderCardData;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  onMarkPaid?: (id: string) => void;
};

export function WorkOrderCard({ data, onStart, onComplete, onMarkPaid }: Props) {
  const statusLabel = (s: WorkOrderStatus): string => {
    if (s === "IN_PROGRESS") return "Started";
    if (s === "COMPLETED") return "Completed";
    if (s === "CANCELLED") return "Cancelled";
    // PENDING or SCHEDULED → Not Started
    return "Not Started";
  };

  const statusColor = (s: WorkOrderStatus): "green" | "blue" | "yellow" | "gray" | "red" => {
    if (s === "COMPLETED") return "green";
    if (s === "IN_PROGRESS") return "blue";
    if (s === "SCHEDULED") return "yellow";
    if (s === "CANCELLED") return "red";
    return "gray";
  };

  const billingLabel = (b?: "PENDING" | "PAID" | "CANCELLED"): string => {
    if (b === "PAID") return "Payment Completed";
    if (b === "CANCELLED") return "Payment Cancelled";
    return "Payment Pending";
  };

  const billingColor = (b?: "PENDING" | "PAID" | "CANCELLED"): "green" | "red" | "gray" => {
    if (b === "PAID") return "green";
    if (b === "CANCELLED") return "red";
    return "gray";
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">{data.title}</h3>
          <p className="text-sm text-gray-500">{data.customer?.name} — {data.customer?.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={statusColor(data.status)}>{statusLabel(data.status)}</Badge>
          <Badge color={billingColor(data.billingStatus)}>{billingLabel(data.billingStatus)}</Badge>
        </div>
      </div>
      {data.description && (
        <p className="mt-2 text-sm text-gray-700">{data.description}</p>
      )}
      <div className="mt-3 flex gap-2">
        {onStart && (
          <Button variant="secondary" onClick={() => onStart(data.id)} disabled={data.status === "IN_PROGRESS" || data.status === "COMPLETED"}>Start Job</Button>
        )}
        {onComplete && (
          <Button onClick={() => onComplete(data.id)} disabled={data.status === "COMPLETED"}>Complete Job</Button>
        )}
        {onMarkPaid && (
          <Button variant="ghost" onClick={() => onMarkPaid(data.id)} disabled={data.billingStatus === "PAID"}>Mark Paid</Button>
        )}
      </div>
    </div>
  );
}


