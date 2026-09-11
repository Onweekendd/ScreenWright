import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";

import type { ComponentType } from "@screenwright/types";

import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useActiveAgentBISession } from "../agentBISessionContext";
import { buildComponentPath } from "../componentPath";
import {
  buildMentionText,
  calculateMentionEndOffset,
  calculateNextIndex,
  extractPlainTextFromNodes,
  parseAtTrigger
} from "./mentionUtils";

interface Emit {
  (event: "update:modelValue", value: string): void;
  (event: "send"): void;
  (event: "mention-click", component: ComponentType): void;
}

/**
 * ChatInput 输入框的所有交互逻辑
 *
 * @param emit - 组件 emit 函数，用于触发 update:modelValue、send、mention-click 事件
 * @returns 编辑器 ref、下拉框 ref、mention 状态、样式及所有事件处理函数
 */
export function useChatInput(emit: Emit) {
  const { selectTargetData, componentList } = useEditStore();
  const { mentionedComponents } = useActiveAgentBISession();
  const { allComponentMap } = useGlobalComponentData();

  // ─── DOM refs ────────────────────────────────────────────────
  const editorRef = ref<HTMLDivElement>();
  const dropdownRef = ref<HTMLUListElement>();

  // ─── mention 状态 ─────────────────────────────────────────────
  const mention = reactive({
    active: false,
    query: "",
    activeIndex: 0,
    /** @ 符号所在的 TextNode 和偏移，用于后续替换 */
    anchorNode: null as Text | null,
    anchorOffset: 0
  });

  const dropdownStyle = ref({ top: "0px", left: "0px", minWidth: "160px" });

  // ─── 性能优化：缓存和防抖 ────────────────────────────────────
  let lastEmittedText = "";
  let syncTimer: ReturnType<typeof setTimeout> | null = null;
  const SYNC_DELAY = 150; // 防抖延迟

  /**
   * 延迟同步文本内容，避免每次 input 都遍历 DOM
   */
  function scheduleTextSync(editor: HTMLElement) {
    if (syncTimer) {
      clearTimeout(syncTimer);
    }
    syncTimer = setTimeout(() => {
      const currentText = getPlainText(editor);
      if (currentText !== lastEmittedText) {
        lastEmittedText = currentText;
        emit("update:modelValue", currentText);
      }
    }, SYNC_DELAY);
  }

  /**
   * 立即同步文本内容（用于关键操作后）
   */
  function syncTextImmediately(editor: HTMLElement) {
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }
    const currentText = getPlainText(editor);
    lastEmittedText = currentText;
    emit("update:modelValue", currentText);
  }

  const componentFullMap = computed(() => {
    /**
     * namePath -> { namePath, idPath, component }
     * namePath 格式: 面板名/状态名/.../组件名
     * idPath   格式: {面板id}_{面板名}/{状态id}_{状态名}/.../{组件id}_{组件名}
     */
    const map = new Map<string, { namePath: string; idPath: string; component: ComponentType }>();

    Array.from(allComponentMap.value).forEach(([, component]) => {
      const { namePath, idPath } = buildComponentPath(component, allComponentMap.value);
      map.set(namePath, { component, idPath, namePath });
    });

    return map;
  });

  /**
   * 根据当前输入的 query 过滤候选组件列表
   * 未输入 query 时取前 10 条；否则按名称路径模糊匹配后取前 10 条
   */
  const filteredComponents = computed(() => {
    const entries = Array.from(componentFullMap.value.values());
    const q = mention.query.toLowerCase();
    const limited = q
      ? entries.filter(({ namePath }) => namePath.toLowerCase().includes(q)).slice(0, 10)
      : entries.slice(0, 10);
    return limited.map(({ namePath, idPath, component }) => ({
      displayPath: namePath,
      // agent 可通过名称路径和 id 路径双重定位组件
      rfContent: `${namePath}|${idPath}`,
      component
    }));
  });

  /**
   * 获取光标前的 @ 触发信息
   *
   * @returns 包含匹配结果、文本节点、光标偏移、@ 符号偏移的对象；未触发时返回 null
   */
  function getAtTrigger() {
    const sel = window.getSelection();
    if (!sel?.rangeCount) {
      return null;
    }
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
      return null;
    }

    const text = node.textContent ?? "";
    const result = parseAtTrigger(text, range.startOffset);

    if (!result) {
      return null;
    }

    return {
      ...result,
      node: node as Text
    };
  }

  /**
   * 从 contenteditable 元素中提取纯文本内容
   * BR 节点转换为换行符，mention chip 及其他元素读取 textContent
   *
   * @param el - 目标 contenteditable HTMLElement
   * @returns 纯文本字符串
   */
  function getPlainText(el: HTMLElement) {
    return extractPlainTextFromNodes(el.childNodes);
  }

  // ─── 事件处理 ─────────────────────────────────────────────────

  /**
   * 处理编辑器 input 事件
   * 使用防抖同步文本到 modelValue，避免频繁 DOM 遍历
   */
  function handleInput() {
    const editor = editorRef.value;
    if (!editor) {
      return;
    }

    // 延迟同步文本，减少 DOM 遍历频率
    scheduleTextSync(editor);

    // 检测 @ mention 触发（轻量级操作）
    const info = getAtTrigger();
    if (info) {
      mention.active = true;
      mention.query = info.match[1];
      mention.activeIndex = 0;
      mention.anchorNode = info.node;
      mention.anchorOffset = info.atOffset;
    } else {
      mention.active = false;
    }
  }

  /**
   * 处理编辑器键盘事件
   * - mention 激活时：ArrowDown/Up 移动选中项，Enter/Tab 确认选中，Escape 关闭下拉
   * - mention 未激活时：Enter（非 Shift）触发发送
   *
   * @param e - 键盘事件对象
   */
  function handleKeydown(e: KeyboardEvent) {
    if (mention.active) {
      const maxLength = filteredComponents.value.length;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        mention.activeIndex = calculateNextIndex(mention.activeIndex, maxLength, 1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        mention.activeIndex = calculateNextIndex(mention.activeIndex, maxLength, -1);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const target = filteredComponents.value[mention.activeIndex];
        if (target) {
          selectMention(target.component, target.rfContent);
        }
        return;
      }
      if (e.key === "Escape") {
        mention.active = false;
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && !mention.active) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleKeyup() {
    if (mention.active && !getAtTrigger()) {
      mention.active = false;
    }
  }

  /**
   * 处理编辑器点击事件
   * 点击 mention chip 时触发 mention-click 事件，携带对应的组件信息
   *
   * @param e - 鼠标事件对象
   */
  function handleEditorClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains("mention-chip")) {
      const id = target.dataset.componentId;
      const component = componentList.value.find((c) => `${c.id}` === id);

      if (component) {
        emit("mention-click", component);
      }
    }

    // 光标在编辑器内移动后，重新检查 @ 触发状态
    if (mention.active && !getAtTrigger()) {
      mention.active = false;
    }
  }

  /**
   * 处理粘贴事件，过滤富文本，仅插入纯文本内容
   *
   * @param e - 剪贴板事件对象
   */
  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData?.getData("text/plain") ?? "";
    document.execCommand("insertText", false, text);
  }

  /**
   * 创建 mention chip 元素
   *
   * @param component - 组件信息
   * @returns mention chip HTMLElement
   */
  function createMentionChip(component: ComponentType, rfContent: string): HTMLSpanElement {
    const chip = document.createElement("span");
    chip.className = "mention-chip";
    chip.contentEditable = "false";
    chip.dataset.componentId = `${component.id}`;
    chip.dataset.componentRf = rfContent;
    chip.textContent = buildMentionText(rfContent.split("|")[0]);
    return chip;
  }

  /**
   * 插入 mention chip 到指定位置
   * 使用 DocumentFragment 减少重排，提升性能
   *
   * @param chip - mention chip 元素
   * @param anchorNode - 锚点文本节点
   * @param anchorOffset - 锚点偏移量
   * @param queryLength - 查询文本长度
   * @returns 插入的零宽空格节点（用于定位光标）
   */
  function insertMentionChip(chip: HTMLElement, anchorNode: Text, anchorOffset: number, queryLength: number): Text {
    const range = document.createRange();
    range.setStart(anchorNode, anchorOffset);
    const endOffset = calculateMentionEndOffset(anchorOffset, queryLength, anchorNode.length);
    range.setEnd(anchorNode, endOffset);

    // 使用 DocumentFragment 批量插入，减少重排
    const fragment = document.createDocumentFragment();
    const space = document.createTextNode("\u200B");
    fragment.appendChild(chip);
    fragment.appendChild(space);

    range.deleteContents();
    range.insertNode(fragment);

    return space;
  }

  /**
   * 将光标定位到指定节点之后
   *
   * @param node - 目标节点
   */
  function placeCursorAfter(node: Node): void {
    const sel = window.getSelection();
    if (!sel) {
      return;
    }

    const newRange = document.createRange();
    newRange.setStartAfter(node);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  /**
   * 选中 mention 候选项，在光标处将 @query 替换为 chip 节点
   * chip 后自动插入零宽空格以保持光标可继续输入
   *
   * @param component - 被选中的组件信息
   */
  function selectMention(component: ComponentType, rfContent: string) {
    const editor = editorRef.value;
    if (!editor || !mention.anchorNode) {
      return;
    }

    // 创建并插入 mention chip
    const chip = createMentionChip(component, rfContent);
    const space = insertMentionChip(chip, mention.anchorNode, mention.anchorOffset, mention.query.length);

    // 恢复光标位置
    placeCursorAfter(space);

    // 添加到 mentionedComponents（去重）
    if (!mentionedComponents.value.some((c) => c.id === component.id)) {
      mentionedComponents.value = [...mentionedComponents.value, component];
    }

    // 更新状态并同步文本
    mention.active = false;
    syncTextImmediately(editor);
  }

  /**
   * 处理发送操作
   * 提取编辑器纯文本，非空时触发 send 事件并清空编辑器
   */
  function handleSend() {
    const editor = editorRef.value;
    if (!editor) {
      return;
    }
    const text = getPlainText(editor).trim();
    if (!text) {
      return;
    }
    emit("send");
    editor.innerHTML = "";
    emit("update:modelValue", "");
  }

  /**
   * 处理 SelectedComponentsList 的 tag-click 事件
   * 将点击的组件信息透传为 mention-click 事件
   *
   * @param component - 被点击的组件信息
   */
  function handleTagClick(component: ComponentType) {
    emit("mention-click", component);
  }

  /**
   * 处理编辑器外部点击，用于关闭 mention 下拉框
   * 仅当点击目标不在下拉框和编辑器内时关闭
   *
   * @param e - 鼠标事件对象
   */
  function handleOutsideClick(e: MouseEvent) {
    const dropdown = dropdownRef.value;
    const editor = editorRef.value;
    if (dropdown && !dropdown.contains(e.target as Node) && editor && !editor.contains(e.target as Node)) {
      mention.active = false;
    }
  }

  onMounted(() => document.addEventListener("mousedown", handleOutsideClick));
  onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleOutsideClick);
    if (syncTimer) {
      clearTimeout(syncTimer);
    }
  });

  return {
    editorRef,
    dropdownRef,
    mention,
    dropdownStyle,
    filteredComponents,
    selectTargetData,
    handleInput,
    handleKeydown,
    handleKeyup,
    handleEditorClick,
    handlePaste,
    selectMention,
    handleSend,
    handleTagClick
  };
}
