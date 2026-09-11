import { FlaskConical, LayoutDashboard, type LucideIcon, MessageSquare, Wrench } from "lucide-react";

export interface NavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  children?: { title: string; href: string }[];
}

export const mainNavItems: NavItem[] = [
  {
    title: "首页",
    href: "/",
    icon: LayoutDashboard
  },
  {
    title: "会话记录",
    href: "/sessions",
    icon: MessageSquare
  },
  {
    title: "评估结果",
    href: "/evals",
    icon: FlaskConical
  }
];

export const breadcrumbMap: Record<string, string> = {
  "/": "首页",
  "/sessions": "会话记录",
  "/evals": "评估结果"
};

export const appInfo = {
  name: "Agent Trace",
  subtitle: "执行链路追踪平台",
  icon: Wrench
};
