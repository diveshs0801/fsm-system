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
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">{data.title}</h3>
          <p className="text-sm text-gray-500">{data.customer?.name} — {data.customer?.address}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={data.status === "COMPLETED" ? "green" : data.status === "IN_PROGRESS" ? "blue" : data.status === "SCHEDULED" ? "yellow" : "gray"}>{data.status}</Badge>
          <Badge color={data.billingStatus === "PAID" ? "green" : data.billingStatus === "CANCELLED" ? "red" : "gray"}>{data.billingStatus ?? "PENDING"}</Badge>
        </div>
      </div>
      {data.description && (
        <p className="mt-2 text-sm text-gray-700">{data.description}</p>
      )}
      <div className="mt-3 flex gap-2">
        {onStart && (
          <Button variant="secondary" onClick={() => onStart(data.id)}>Start Job</Button>
        )}
        {onComplete && (
          <Button onClick={() => onComplete(data.id)}>Complete Job</Button>
        )}
        {onMarkPaid && (
          <Button variant="ghost" onClick={() => onMarkPaid(data.id)} disabled={data.billingStatus === "PAID"}>Mark Paid</Button>
        )}
      </div>
    </div>
  );
}


