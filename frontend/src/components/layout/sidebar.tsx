"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  CheckSquare,
  Search,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meetings/new", label: "New Meeting", icon: Plus },
  { href: "/commitments", label: "Commitments", icon: CheckSquare },
  { href: "/search", label: "Search Memory", icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <Brain className="h-4.5 w-4.5 text-primary" />
        </div>
        <span className="text-lg font-semibold text-foreground tracking-tight">
          MeetingMind
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-5 py-4">
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <span className="text-primary font-medium">EverMemOS</span>
        </p>
      </div>
    </aside>
  );
}
