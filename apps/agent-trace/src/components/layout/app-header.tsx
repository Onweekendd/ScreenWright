"use client";

import { useMemo, useState } from "react";

import { Bell, ChevronRight, Maximize2, Menu, RefreshCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { breadcrumbMap } from "@/config/navigation";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
};

export function AppHeader({ collapsed, onToggleSidebar }: AppHeaderProps) {
  const pathname = usePathname();

  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const breadcrumbs = useMemo(() => {
    const currentLabel = breadcrumbMap[pathname];
    if (currentLabel) {
      return [{ label: currentLabel, href: pathname }];
    }

    const segments = pathname.split("/").filter(Boolean);
    const items: { label: string; href: string }[] = [];

    let currentPath = "";
    for (const segment of segments) {
      currentPath += `/${segment}`;
      items.push({
        label: breadcrumbMap[currentPath] ?? segment,
        href: currentPath
      });
    }

    return items;
  }, [pathname]);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  return (
    <header className="bg-background flex h-14 shrink-0 items-center justify-between border-b px-4">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          <Menu className="size-4" />
        </Button>

        <Separator orientation="vertical" className="hidden h-5 sm:block" />

        <nav className="text-muted-foreground hidden min-w-0 items-center gap-1 text-sm sm:flex">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <div key={item.href} className="flex items-center gap-1">
                {index > 0 && <ChevronRight className="size-3.5" />}
                <span className={cn("truncate", isLast && "text-foreground font-medium")}>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" aria-label="通知">
          <Bell className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="全屏" onClick={handleFullscreen}>
          <Maximize2 className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="刷新" onClick={handleRefresh}>
          <RefreshCw className="size-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="hover:bg-muted flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
          >
            <Avatar className="size-7">
              <AvatarFallback>FA</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium sm:inline">fan</span>
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="关闭用户菜单"
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="bg-popover absolute right-0 z-50 mt-2 w-40 rounded-lg border p-1 shadow-md">
                <button
                  type="button"
                  className="hover:bg-muted flex w-full rounded-md px-3 py-2 text-left text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  个人中心
                </button>
                <button
                  type="button"
                  className="hover:bg-muted flex w-full rounded-md px-3 py-2 text-left text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  退出登录
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
