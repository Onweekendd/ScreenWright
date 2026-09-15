/**
 * gradientcolor — 渐变色字体插件
 *
 * 选中文字后点击按钮，通过 TinyMCE 对话框选择起始色、结束色、方向，
 * 将选中内容包裹为带渐变 CSS 样式的 <span>。
 *
 * 只在真正加载了 tinymce.min.js 的环境（主编辑器）里注册插件；
 * 离线导出的只读预览包不带 tinymce，模块顶层直接引用全局 tinymce 会在加载时报 ReferenceError。
 */
if (typeof tinymce !== "undefined") {
  tinymce.PluginManager.add("gradientcolor", function (editor) {
  const pluginName = "渐变色";

  /**
   * 将渐变色样式应用到当前选中的文字
   * @param {string} startColor  起始颜色（hex）
   * @param {string} endColor    结束颜色（hex）
   * @param {string} direction   CSS linear-gradient 方向
   */
  function applyGradient(startColor, endColor, direction) {
    const style = [
      `background: linear-gradient(${direction}, ${startColor}, ${endColor})`,
      `-webkit-background-clip: text`,
      `-webkit-text-fill-color: transparent`,
      `background-clip: text`
    ].join("; ");

    editor.undoManager.transact(function () {
      editor.focus();
      const selectedContent = editor.selection.getContent();
      if (selectedContent) {
        editor.selection.setContent(`<span style="${style};">${selectedContent}</span>`);
      }
    });
  }

  // 注册图标：字母 A + 渐变色条
  editor.ui.registry.getAll().icons.gradientcolor ||
    editor.ui.registry.addIcon(
      "gradientcolor",
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
        <path d="M9 16h6l1.5 4h2.1L13 4h-2L5.4 20H7.5L9 16zm3-10.5l2.4 8H9.6L12 5.5z" fill="#222f3e"/>
        <rect x="2"  y="21" width="5" height="2" fill="#222f3e" opacity="0.2"/>
        <rect x="7"  y="21" width="5" height="2" fill="#222f3e" opacity="0.5"/>
        <rect x="12" y="21" width="5" height="2" fill="#222f3e" opacity="0.8"/>
        <rect x="17" y="21" width="5" height="2" fill="#222f3e"/>
      </svg>`
    );

  // 注册工具栏按钮，点击后弹出对话框
  editor.ui.registry.addButton("gradientcolor", {
    icon: "gradientcolor",
    tooltip: pluginName,
    onAction: function () {
      editor.windowManager.open({
        title: pluginName,
        body: {
          type: "panel",
          items: [
            {
              type: "colorinput",
              name: "startColor",
              label: "起始颜色"
            },
            {
              type: "colorinput",
              name: "endColor",
              label: "结束颜色"
            },
            {
              type: "selectbox",
              name: "direction",
              label: "方向",
              items: [
                { value: "to right", text: "→ 从左到右" },
                { value: "to left", text: "← 从右到左" },
                { value: "to bottom", text: "↓ 从上到下" },
                { value: "to top", text: "↑ 从下到上" },
                { value: "135deg", text: "↘ 斜向右下" },
                { value: "45deg", text: "↗ 斜向右上" }
              ]
            }
          ]
        },
        initialData: {
          startColor: "#ff6b6b",
          endColor: "#4ecdc4",
          direction: "to right"
        },
        buttons: [
          { type: "cancel", text: "取消" },
          { type: "submit", text: "应用", primary: true }
        ],
        onSubmit: function (api) {
          const data = api.getData();
          applyGradient(data.startColor, data.endColor, data.direction);
          api.close();
        }
      });
    }
  });
  });
}
