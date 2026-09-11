import { h } from "vue";

import { ElMessageBox } from "element-plus";

import type { EditorScreenShotMode } from "./types";

/**
 * 弹窗让用户选择构建页封面截图模式
 * @returns 所选模式；用户关闭弹窗时返回 null
 */
export async function promptEditorScreenShotMode(): Promise<EditorScreenShotMode | null> {
  try {
    await ElMessageBox.confirm(
      h("div", { class: "editor-screen-shot-mode-tip" }, [
        h("div", { style: "margin-bottom: 16px" }, [
          h("div", { style: "font-weight: 600; margin-bottom: 4px" }, "完整模式（推荐）"),
          h(
            "div",
            { style: "color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.5" },
            "分层合成截图，耗时较长，可正确处理面板、视频、复杂文本等场景。"
          )
        ]),
        h("div", null, [
          h("div", { style: "font-weight: 600; margin-bottom: 4px" }, "简单模式"),
          h(
            "div",
            { style: "color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.5" },
            "整屏一次截取，速度快，部分复杂场景可能无法完整呈现。"
          )
        ])
      ]),
      "选择截图模式",
      {
        confirmButtonText: "完整模式",
        cancelButtonText: "简单模式",
        distinguishCancelAndClose: true,
        customClass: "sw-message-box"
      }
    );
    return "full";
  } catch (action) {
    if (action === "cancel") {
      return "simple";
    }
    return null;
  }
}
