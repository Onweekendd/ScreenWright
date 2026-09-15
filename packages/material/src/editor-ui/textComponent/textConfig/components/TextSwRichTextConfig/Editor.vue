<template>
  <div class="tiptap-frame">
    <div v-if="editor" class="tiptap-toolbar" role="toolbar" aria-label="富文本工具栏">
      <button type="button" title="撤销" :disabled="!editor.can().undo()" @mousedown.prevent @click="editor.chain().focus().undo().run()">↶</button>
      <button type="button" title="重做" :disabled="!editor.can().redo()" @mousedown.prevent @click="editor.chain().focus().redo().run()">↷</button>

      <span class="toolbar-divider" />

      <select :value="fontFamilyValue" title="字体" @change="setFontFamily">
        <option value="">默认字体</option>
        <option v-for="font in fontFamily" :key="font.value" :value="font.value">{{ font.label }}</option>
      </select>
      <select :value="fontSizeValue" title="字号" @change="setFontSize">
        <option value="">字号</option>
        <option v-for="size in fontSizes" :key="size" :value="size">{{ size }}</option>
      </select>
      <label class="color-picker" title="文字颜色"><input :value="colorValue" type="color" @input="setColor" /></label>

      <span class="toolbar-divider" />

      <button type="button" title="粗体" :class="{ active: editor.isActive('bold') }" @mousedown.prevent @click="editor.chain().focus().toggleBold().run()"><strong>B</strong></button>
      <button type="button" title="斜体" :class="{ active: editor.isActive('italic') }" @mousedown.prevent @click="editor.chain().focus().toggleItalic().run()"><em>I</em></button>
      <button type="button" title="下划线" :class="{ active: editor.isActive('underline') }" @mousedown.prevent @click="editor.chain().focus().toggleUnderline().run()"><span class="underline">U</span></button>

      <span class="toolbar-divider" />

      <button type="button" title="左对齐" :class="{ active: editor.isActive({ textAlign: 'left' }) }" @mousedown.prevent @click="editor.chain().focus().setTextAlign('left').run()">☰</button>
      <button type="button" title="居中" :class="{ active: editor.isActive({ textAlign: 'center' }) }" @mousedown.prevent @click="editor.chain().focus().setTextAlign('center').run()">≡</button>
      <button type="button" title="右对齐" :class="{ active: editor.isActive({ textAlign: 'right' }) }" @mousedown.prevent @click="editor.chain().focus().setTextAlign('right').run()">☷</button>
      <button type="button" title="项目符号列表" :class="{ active: editor.isActive('bulletList') }" @mousedown.prevent @click="editor.chain().focus().toggleBulletList().run()">•≡</button>
      <button type="button" title="编号列表" :class="{ active: editor.isActive('orderedList') }" @mousedown.prevent @click="editor.chain().focus().toggleOrderedList().run()">1≡</button>
      <button type="button" title="分隔线" @mousedown.prevent @click="editor.chain().focus().setHorizontalRule().run()">─</button>
    </div>

    <EditorContent :editor="editor" class="tiptap-content" />
  </div>
</template>

<script setup lang="ts">
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { Extension } from "@tiptap/core";
import { computed, onBeforeUnmount, watch } from "vue";
import { useVModel } from "@vueuse/core";

import { fontFamily } from "@editor/fontFamily";

const props = defineProps({
  modelValue: { type: String, default: "" },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits(["update:modelValue", "change"]);
const model = useVModel(props, "modelValue", emit);
const fontSizes = Array.from({ length: 31 }, (_, index) => `${index * 2 + 12}px`);

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, string | null>) =>
              attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {}
          }
        }
      }
    ];
  }
});

const editor = useEditor({
  content: model.value,
  editable: !props.disabled,
  extensions: [
    StarterKit,
    TextStyle,
    FontSize,
    Color,
    FontFamily,
    TextAlign.configure({ types: ["heading", "paragraph"] })
  ],
  onUpdate: ({ editor: currentEditor }) => {
    const html = currentEditor.getHTML();
    if (html !== model.value) {
      model.value = html;
      emit("change", html);
    }
  }
});

const textStyleAttributes = computed<Record<string, string | undefined>>(
  () => (editor.value?.getAttributes("textStyle") as Record<string, string | undefined>) ?? {}
);
const fontFamilyValue = computed(() => textStyleAttributes.value.fontFamily ?? "");
const fontSizeValue = computed(() => textStyleAttributes.value.fontSize ?? "");
const colorValue = computed(() => textStyleAttributes.value.color ?? "#ffffff");

const setFontFamily = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  const chain = editor.value?.chain().focus();
  if (!chain) return;
  value ? chain.setFontFamily(value).run() : chain.unsetFontFamily().run();
};

const setFontSize = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value;
  const chain = editor.value?.chain().focus();
  if (!chain) return;
  value ? chain.setMark("textStyle", { fontSize: value }).run() : chain.removeEmptyTextStyle().run();
};

const setColor = (event: Event) => {
  editor.value?.chain().focus().setColor((event.target as HTMLInputElement).value).run();
};

watch(
  () => props.modelValue,
  (value) => {
    const currentEditor = editor.value;
    if (currentEditor && value !== currentEditor.getHTML()) {
      currentEditor.commands.setContent(value || "", { emitUpdate: false });
    }
  }
);

watch(
  () => props.disabled,
  (disabled) => editor.value?.setEditable(!disabled)
);

onBeforeUnmount(() => editor.value?.destroy());
</script>

<style lang="scss">
.tiptap-frame {
  padding: 0 5px;
  color: #b4b7c1;
}

.tiptap-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding: 6px;
  background: #383b47;
  border: 1px solid #3e4049;
  border-bottom: 0;

  button,
  select {
    height: 28px;
    color: #b4b7c1;
    background: transparent;
    border: 0;
    border-radius: 2px;
    cursor: pointer;
  }

  button {
    min-width: 28px;
    font-size: 15px;

    &:hover,
    &.active {
      background: var(--sw-theme-color);
    }

    &:disabled {
      color: rgba(180, 183, 193, 0.5);
      cursor: not-allowed;
    }
  }

  select {
    max-width: 120px;
    padding: 0 6px;
    border: 1px solid #565966;
  }

  option {
    color: #b4b7c1;
    background: #383b47;
  }
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  margin: 0 2px;
  background: #60636d;
}

.underline {
  text-decoration: underline;
}

.color-picker {
  display: inline-flex;
  width: 28px;
  height: 28px;
  padding: 4px;
  border: 1px solid #565966;
  border-radius: 2px;
  cursor: pointer;

  input {
    width: 100%;
    padding: 0;
    cursor: pointer;
    background: transparent;
    border: 0;
  }
}

.tiptap-content {
  min-height: 480px;
  max-height: 480px;
  overflow-y: auto;
  background: #1a1e27;
  border: 1px solid #3e4049;

  .tiptap {
    min-height: 480px;
    padding: 8px;
    color: #ffffff;
    outline: none;

    p {
      margin: 5px 0;
    }

    ul,
    ol {
      padding-left: 24px;
    }

    hr {
      border: 0;
      border-top: 1px solid #60636d;
    }
  }
}
</style>
