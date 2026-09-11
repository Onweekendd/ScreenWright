"use client";

import { useEffect, useMemo, useState } from "react";

import Editor from "@monaco-editor/react";

/**
 * 只读 JSON 查看器：用 Monaco(VSCode 内核)渲染，带语法高亮/折叠/搜索。
 * @monaco-editor/react 默认走 CDN loader，免去 Turbopack 下的 worker 打包配置。
 * SSR 阶段 Editor 自渲染占位，无需额外 dynamic(ssr:false)。
 */
export function JsonMonacoViewer({ value }: { value: unknown }) {
  const json = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }, [value]);

  // 跟随全局 .dark 主题：初始读一次 + MutationObserver 监听 html class 变化
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="max-h-[520px] overflow-hidden rounded-lg border">
      <Editor
        height="520px"
        defaultLanguage="json"
        language="json"
        value={json}
        theme={isDark ? "vs-dark" : "vs"}
        options={{
          readOnly: true,
          domReadOnly: true,
          minimap: { enabled: false },
          fontSize: 12,
          lineNumbers: "on",
          folding: true,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          renderLineHighlight: "none",
          scrollbar: { alwaysConsumeMouseWheel: false }
        }}
      />
    </div>
  );
}
