"use client";

import { useCallback, useState, useTransition } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * 会话浏览页的客户端交互逻辑：数据全部由服务端组件（sessions/page.tsx）按 URL 查询参数拉取，
 * 这里只负责把用户交互（选中 thread、选中文件、刷新）落到 URL 上，并管理纯 UI 折叠状态。
 *
 * - `thread` 查询参数：当前选中的会话；切换时清空 `object`。
 * - `object` 查询参数：当前查看的 MinIO 交换记录。
 * 导航统一包裹在 `useTransition` 中，`isPending` 用于展示加载态。
 */
export function useSessionsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // 记录被手动折叠的 turn（默认全部展开，故只需存"被折叠"的项）。
  const [collapsedTurns, setCollapsedTurns] = useState<Record<string, boolean>>({});

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const query = params.toString();
      startTransition(() => {
        // scroll: false —— 会话浏览是左右面板布局，切换选中项不应把页面滚回顶部。
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const selectThread = useCallback(
    (threadId: string) => {
      pushParams({ thread: threadId, turn: null, object: null });
    },
    [pushParams]
  );

  // 选中一轮 → 展示整轮合并对话；清空 object（退出单步原始视图）。
  const selectTurn = useCallback(
    (turnName: string) => {
      pushParams({ turn: turnName, object: null });
    },
    [pushParams]
  );

  // 选中单个 step 文件 → 单步原始视图（object 存在时优先于 turn）。
  const selectObject = useCallback(
    (objectKey: string) => {
      pushParams({ object: objectKey });
    },
    [pushParams]
  );

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const toggleTurn = useCallback((turnKey: string) => {
    setCollapsedTurns((current) => ({ ...current, [turnKey]: !current[turnKey] }));
  }, []);

  const isTurnExpanded = useCallback((turnKey: string) => !collapsedTurns[turnKey], [collapsedTurns]);

  return { isPending, selectThread, selectTurn, selectObject, refresh, toggleTurn, isTurnExpanded };
}
