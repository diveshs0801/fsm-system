"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarVariant = "admin" | "technician";

type NavItem = { label: string; href: string; icon?: React.ReactNode };

function getItems(variant: SidebarVariant): NavItem[] {
  if (variant === "admin") {
    return [
      { label: "Dashboard", href: "/admin" },
      { label: "Work Orders", href: "/admin/work-orders" },
      { label: "Technicians", href: "/admin/technicians" },
      { label: "Customers", href: "/admin/customers" },
      { label: "Inventory", href: "/admin/inventory" },
      { label: "Billing", href: "/admin/billing" },
      { label: "Optimize Route", href: "/admin/optimize" },
    ];
  }
  return [
    { label: "Dashboard", href: "/technician" },
    { label: "My Jobs", href: "/technician/jobs" },
    { label: "Inventory", href: "/technician/inventory" },
    { label: "History", href: "/technician/history" },
    { label: "Settings", href: "/technician/settings" },
  ];
}

export function Sidebar({ variant = "admin" as SidebarVariant }: { variant?: SidebarVariant }) {
  const pathname = usePathname();
  const items = getItems(variant);

  return (
    <aside className="w-64 shrink-0 border-r bg-white min-h-screen hidden md:block">
      <div className="px-4 py-4 border-b">
        <div className="text-lg font-semibold">{variant === "admin" ? "Admin" : "Technician"}</div>
        <div className="text-xs text-gray-500">FSM System</div>
      </div>
      <nav className="px-2 py-3 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                "flex items-center gap-2 rounded px-3 py-2 text-sm transition border-l-4 " +
                (active
                  ? "bg-gray-100 text-gray-900 font-medium border-gray-900"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 border-transparent")
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto"></div>
    </aside>
  );
}

export default Sidebar;


