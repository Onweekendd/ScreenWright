"use client";

import { useState } from "react";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { appInfo, mainNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  collapsed: boolean;
};

export function AppSidebar({ collapsed }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground flex h-full shrink-0 flex-col border-r transition-[width] duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className={cn("flex h-14 items-center gap-3 border-b px-4", collapsed && "justify-center px-2")}>
        <div className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-lg">
          <appInfo.icon className="size-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{appInfo.name}</p>
            <p className="text-muted-foreground truncate text-xs">{appInfo.subtitle}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNavItems.map((item) => (
          <SidebarNavItem key={item.title} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </nav>
    </aside>
  );
}

function SidebarNavItem({
  item,
  pathname,
  collapsed
}: {
  item: (typeof mainNavItems)[number];
  pathname: string;
  collapsed: boolean;
}) {
  const hasChildren = Boolean(item.children?.length);
  const childActive = item.children?.some((child) => pathname === child.href);
  const [open, setOpen] = useState(Boolean(childActive));
  const isActive = item.href ? pathname === item.href : Boolean(childActive);

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          title={collapsed ? item.title : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <item.icon className="size-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>

              <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
            </>
          )}
        </button>

        {!collapsed && open && (
          <div className="space-y-1 pl-3">
            {item.children?.map((child) => {
              const active = pathname === child.href;
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2 pl-8 text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {child.title}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href ?? "/"}
      title={collapsed ? item.title : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <item.icon className="size-4 shrink-0" />
      {!collapsed && <span>{item.title}</span>}
    </Link>
  );
}
