"use client";

import {
  BarChart3Icon,
  FolderIcon,
  ImagesIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UploadIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const DASHBOARD_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/dashboard/albums", label: "Albums", icon: FolderIcon },
  { href: "/dashboard/media", label: "My Media", icon: ImagesIcon },
  { href: "/dashboard/upload", label: "Upload", icon: UploadIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3Icon },
  { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function DashboardNav({
  orientation = "vertical",
  onNavigate,
}: {
  orientation?: "vertical" | "horizontal";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Dashboard"
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "flex-row overflow-x-auto",
      )}
    >
      {DASHBOARD_LINKS.map((link) => {
        const active = "exact" in link && link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <link.icon className="size-4" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
