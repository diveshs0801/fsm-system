"use client";

import React from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export function PageHeader({ title, subtitle, crumbs, right }: { title: string; subtitle?: string; crumbs?: { label: string; href?: string }[]; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        {crumbs && crumbs.length > 0 && <Breadcrumbs items={crumbs} />}
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export default PageHeader;


