"use client";

import React from "react";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  color?: "gray" | "blue" | "green" | "yellow" | "red";
};

export function Badge({ className = "", color = "gray", ...props }: BadgeProps) {
  const colors: Record<NonNullable<BadgeProps["color"]>, string> = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
  };
  return <span className={`inline-flex items-center px-2 py-1 text-xs rounded ${colors[color]} ${className}`} {...props} />;
}


