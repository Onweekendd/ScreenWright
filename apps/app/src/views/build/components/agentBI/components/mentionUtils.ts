import type { ComponentType } from "@screenwright/types";

/**
 * mention 辅助工具函数集合
 * 所有函数都是纯函数，无副作用，易于测试
 */

/**
 * 从文本中提取 @ 符号及其后的查询内容
 *
 * @param text - 要分析的文本
 * @param cursorOffset - 光标在文本中的位置
 * @returns 包含匹配结果、光标偏移、@ 符号偏移的对象；未触发时返回 null
 * @example
 * parseAtTrigger("hello @foo bar", 10) // { match: ["@foo", "foo"], query: "foo", cursorOffset: 10, atOffset: 6 }
 */
export function parseAtTrigger(text: string, cursorOffset: number) {
  const textBefore = text.slice(0, cursorOffset);
  const match = textBefore.match(/@([^@\s]*)$/);

  if (!match) {
    return null;
  }

  return {
    match,
    query: match[1],
    cursorOffset,
    atOffset: cursorOffset - match[0].length
  };
}

/**
 * 过滤组件列表，根据查询文本模糊匹配
 *
 * @param components - 所有组件列表
 * @param query - 查询文本，为空时返回前 N 个
 * @param limit - 返回结果的最大数量
 * @returns 过滤后的组件列表
 * @example
 * filterComponents([{name: "Button"}, {name: "Input"}], "btn", 10) // [{name: "Button"}]
 */
export function filterComponents(components: ComponentType[], query: string, limit: number = 10): ComponentType[] {
  if (!query) {
    return components.slice(0, limit);
  }

  const q = query.toLowerCase();
  return components.filter((c) => c.name.toLowerCase().includes(q)).slice(0, limit);
}

/**
 * 计算 mention 替换范围的结束偏移量
 *
 * @param anchorOffset - @ 符号的起始偏移
 * @param queryLength - 查询文本长度
 * @param maxOffset - 最大允许偏移量（文本节点长度）
 * @returns 结束偏移量
 */
export function calculateMentionEndOffset(anchorOffset: number, queryLength: number, maxOffset: number): number {
  const endOffset = anchorOffset + 1 + queryLength; // +1 是 @ 符号
  return Math.min(endOffset, maxOffset);
}

/**
 * 构建 mention chip 显示文本
 *
 * @param componentName - 组件名称
 * @returns mention 文本，格式为 "@组件名"
 */
export function buildMentionText(componentName: string): string {
  return `@${componentName}`;
}

/**
 * 从 contenteditable 元素的子节点中提取纯文本
 * BR 节点转换为换行符，其他元素读取 textContent
 *
 * @param childNodes - 子节点列表
 * @returns 纯文本字符串
 * @example
 * extractPlainTextFromNodes([textNode, brNode, elementNode]) // "hello\nworld"
 */
export function extractPlainTextFromNodes(childNodes: NodeListOf<ChildNode>): string {
  let text = "";

  for (const node of Array.from(childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const elem = node as HTMLElement;
      if (elem.tagName === "BR") {
        text += "\n";
      } else if (elem.dataset?.componentRf) {
        text += `<component-rf>${elem.dataset.componentRf}</component-rf>`;
      } else {
        text += elem.textContent ?? "";
      }
    }
  }

  return text;
}

/**
 * 判断索引是否在有效范围内
 *
 * @param index - 要检查的索引
 * @param length - 数组/列表长度
 * @returns 是否在范围内
 */
export function isValidIndex(index: number, length: number): boolean {
  return index >= 0 && index < length;
}

/**
 * 计算下一个索引（用于下拉菜单导航）
 *
 * @param currentIndex - 当前索引
 * @param length - 列表长度
 * @param step - 步长，默认为 1
 * @returns 下一个索引
 */
export function calculateNextIndex(currentIndex: number, length: number, step: number = 1): number {
  return Math.min(Math.max(currentIndex + step, 0), length - 1);
}
