/**
 * Vue 片段预览相关工具函数
 */

import type { Component } from "vue";

export interface ComponentOptions {
  name?: string;
  inject?: string[];
  components?: Record<string, Component>;
  data?: () => Record<string, unknown>;
  watch?: Record<string, unknown>;
  computed?: Record<string, unknown>;
  beforeCreate?: () => void;
  created?: () => void;
  beforeMount?: () => void;
  mounted?: () => void;
  beforeUpdate?: () => void;
  updated?: () => void;
  beforeDestroy?: () => void;
  destroyed?: () => void;
  methods?: Record<string, (...args: unknown[]) => unknown>;
  [key: string]: unknown;
}

export interface InfoObject {
  id: string;
  list: unknown[];
  emitEvent: (eventString: string, info: unknown) => void;
  defaultFun: {
    cloneDeep: <T>(value: T) => T;
    debounce: <T extends (...args: unknown[]) => unknown>(fn: T, wait: number) => T;
    throttle: <T extends (...args: unknown[]) => unknown>(fn: T, wait: number) => T;
    setMinioUrl: (url: string, toAbsolutePath?: boolean) => string;
    html2canvas?: unknown;
    ElMessage?: (typeof import("element-plus"))["ElMessage"];
    ElLoading?: (typeof import("element-plus"))["ElLoading"];
  };
}

/**
 * 包装脚本代码为 SFC script 标签
 * 支持 Vue 2 generate 函数模式和 Vue 3 script setup 模式
 */
export const wrapScript = (scriptCode: string, infoObj: InfoObject): string => {
  if (/^function\s+generate\s*\(/.test(scriptCode.trim())) {
    // Vue 2 generate 函数模式
    let generateFn: (info: InfoObject) => ComponentOptions;
    try {
      generateFn = new Function(`${scriptCode}; return generate;`)() as typeof generateFn;
    } catch (e) {
      return `<script>\n// 解析 generate 函数出错: ${e}\n</script>`;
    }

    let options: ComponentOptions;
    try {
      options = generateFn(infoObj);
    } catch (e) {
      return `<script>\n// 执行 generate(info) 出错: ${e}\n</script>`;
    }

    return `<script>\nexport default ${JSON.stringify(options, null, 2)}\n</script>`;
  } else {
    // Vue 3 script setup 模式
    return `<script setup lang="ts">\n${scriptCode}\n</script>`;
  }
};

/**
 * 包装 Vue 2 Options API 脚本，返回组件配置对象
 * @param utils 注入到 generate 作用域的依赖（如 html2canvas、ElMessage），低代码业务在片段内自行调用
 * @returns 组件配置对象，或错误时返回错误信息字符串
 */
export const wrapScriptVue2 = (
  scriptCode: string,
  infoObj: InfoObject,
  utils: Record<string, unknown> = {}
): ComponentOptions | string => {
  let generateFn: (info: InfoObject) => ComponentOptions;
  try {
    const utilKeys = Object.keys(utils);
    const utilValues = Object.values(utils);
    generateFn = new Function(...utilKeys, `${scriptCode}; return generate;`)(...utilValues) as typeof generateFn;
  } catch (e) {
    return `解析 generate 函数出错: ${e instanceof Error ? e.message : String(e)}`;
  }

  let options: ComponentOptions;
  try {
    options = generateFn(infoObj);
  } catch (e) {
    return `执行 generate(info) 出错: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Vue 2 → Vue 3 生命周期名映射
  const lifecycleMap: Record<string, string> = {
    beforeDestroy: "beforeUnmount",
    destroyed: "unmounted"
  };
  for (const [v2, v3] of Object.entries(lifecycleMap)) {
    if (v2 in options && !(v3 in options)) {
      options[v3] = options[v2];
      delete options[v2];
    }
  }

  return options;
};

/**
 * 包装样式代码为 SFC style 标签
 */
export const wrapStyle = (styleCode: string): string => {
  if (!/^<style/.test(styleCode.trim())) {
    return `<style lang="scss" scoped>\n${styleCode}\n</style>`;
  }
  return styleCode;
};

/**
 * 移除 import/export 语句
 */
export const stripImportsExports = (code: string): string => {
  return code
    .replace(/import\s+[^;]+;/g, "")
    .replace(/export\s+default/g, "return")
    .replace(/export\s+\{[^}]+\};?/g, "")
    .replace(/export\s+(const|let|var|function|class)\s+/g, "$1 ")
    .replace(/export\s+(type|interface)\s+/g, "$1 ")
    .replace(/^\s*export\s*;?\s*$/gm, "");
};

/**
 * 自动为 setup 函数添加 return 语句
 * 如果用户已经写了 return，则不处理
 */
export const autoReturnSetupVars = (code: string): string => {
  if (/\breturn\b/.test(code)) {
    return code;
  }

  // 匹配所有声明的变量名
  const varMatches = [...code.matchAll(/^[ \t]*(?:const|let|var)\s+([a-zA-Z0-9_]+)/gm)];
  const fnMatches = [...code.matchAll(/^[ \t]*function\s+([a-zA-Z0-9_]+)/gm)];
  const classMatches = [...code.matchAll(/^[ \t]*class\s+([a-zA-Z0-9_]+)/gm)];

  const varNames = Array.from(
    new Set([...varMatches.map((m) => m[1]), ...fnMatches.map((m) => m[1]), ...classMatches.map((m) => m[1])])
  );

  if (varNames.length === 0) {
    return code;
  }
  return `${code}\nreturn { ${varNames.join(", ")} }`;
};

/**
 * 提取 defineEmits 中的事件名
 */
export const extractEmits = (scriptCode: string): string[] => {
  const match = scriptCode.match(/defineEmits\s*\(\s*\[([^\]]*)\]/);
  if (!match) {
    return [];
  }
  return match[1]
    .split(",")
    .map((e) => e.replace(/['"`\s]/g, ""))
    .filter(Boolean);
};

/**
 * 为 CSS 选择器添加 ID 前缀，实现样式隔离
 * @param cssCode CSS 代码
 * @param containerId 容器 ID（不含 #）
 */
export const addCssIdPrefix = (cssCode: string, containerId: string): string => {
  if (!cssCode.trim()) {
    return "";
  }

  const lines = cssCode.trim().split("\n");
  const result: string[] = [];
  const prefix = `#${containerId} `;

  let inComment = false;
  let inAtRule = false;
  let atRuleDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // 处理多行注释
    if (trimmed.includes("/*") && !trimmed.includes("*/")) {
      inComment = true;
      result.push(line);
      continue;
    }
    if (inComment) {
      if (trimmed.includes("*/")) {
        inComment = false;
      }
      result.push(line);
      continue;
    }

    // 跳过空行和单行注释
    if (!trimmed || trimmed.startsWith("//")) {
      result.push(line);
      continue;
    }

    // 处理 @ 规则（@media, @keyframes, @supports 等）
    if (trimmed.startsWith("@")) {
      inAtRule = true;
      if (trimmed.includes("{")) {
        atRuleDepth++;
      }
      result.push(line);
      continue;
    }

    // 跟踪 @ 规则的括号深度
    if (inAtRule) {
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      atRuleDepth += openBraces - closeBraces;

      if (atRuleDepth <= 0) {
        inAtRule = false;
        atRuleDepth = 0;
      }

      // @keyframes 内部不添加前缀
      if (trimmed.match(/^(from|to|\d+%)/)) {
        result.push(line);
        continue;
      }
    }

    // 处理选择器行
    if (trimmed.includes("{") && !trimmed.startsWith("@")) {
      const braceIndex = line.indexOf("{");
      const selectorPart = line.slice(0, braceIndex).trim();
      const restPart = line.slice(braceIndex);

      // 分割多个选择器
      const selectors = selectorPart.split(",").map((s) => s.trim());
      const prefixedSelectors = selectors.map((selector) => {
        // 跳过空选择器
        if (!selector) {
          return selector;
        }
        // 已经是 ID 选择器开头、或是伪元素/伪类开头的不添加前缀
        if (selector.startsWith("#") || selector.startsWith(":")) {
          return selector;
        }
        return prefix + selector;
      });

      result.push(prefixedSelectors.join(", ") + restPart);
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
};
