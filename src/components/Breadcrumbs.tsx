"use client";

import React from "react";
import Link from "next/link";

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-600">
      <ol className="flex items-center gap-2">
        {items.map((c, idx) => (
          <li key={idx} className="flex items-center gap-2">
            {c.href ? (
              <Link className="hover:text-gray-900 hover:underline" href={c.href}>{c.label}</Link>
            ) : (
              <span className="text-gray-900 font-medium">{c.label}</span>
            )}
            {idx < items.length - 1 && <span className="text-gray-400">/</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;


