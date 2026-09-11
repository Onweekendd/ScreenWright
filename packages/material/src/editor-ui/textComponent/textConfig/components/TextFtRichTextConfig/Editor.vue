<template>
  <!-- 富文本 -->
  <div class="tinymce-frame" ref="tinymceFrameRef">
    <Editor v-model="model" :init="init" :disabled="disabled" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useVModel } from "@vueuse/core";

import Editor from "@tinymce/tinymce-vue";

import { fontFamily } from "@editor/fontFamily";

import "./plugins_letterspacing.js";
import "./plugins_gradientcolor.js";

const props = defineProps({
  modelValue: {
    type: String,
    default: ""
  },
  disabled: {
    type: Boolean,
    default: false
  },
  plugins: {
    type: [String, Array],
    default: "letterspacing gradientcolor"
  },
  toolbar: {
    type: [String, Array],
    default:
      "undo redo | fontselect fontsizeselect | forecolor gradientcolor bold italic underline | letterspacing lineheight alignleft aligncenter alignright alignjustify | bullist numlist outdent indent hr"
  }
});

const emit = defineEmits(["update:modelValue", "change"]);
const model = useVModel(props, "modelValue", emit);
watch(
  () => model.value,
  (newVal) => {
    emit("change", newVal);
  }
);

const tinymceFrameRef = ref<HTMLElement | null>(null);

// 初始化配置
const init = {
  // menubar: true, // 菜单栏显隐
  language: "zh_CN",
  height: 480,
  min_height: 480,
  max_height: 480,
  plugins: props.plugins,
  toolbar: props.toolbar,
  content_style: "p {margin: 5px 0; padding: 0px !important; color: #ffffff;}",
  fontsize_formats:
    "12px 14px 16px 18px 20px 22px 24px 26px 28px 30px 32px 34px 36px 38px 40px 42px 44px 46px 48px 50px 52px 54px 56px 58px 60px 62px 64px 66px 68px 70px 72px",
  lineheight_formats: "1 1.1 1.2 1.3 1.4 1.5 1.6 1.7 1.8 1.9 2 2.1 2.2 2.3 2.4 2.5",
  font_formats: fontFamily.map((a) => a.label + "=" + a.label).join(";"),
  branding: false,
  menubar: false,

  // 图片上传
  images_upload_handler: function (blobInfo: any, success: Function, _failure: Function) {
    const img = "data:image/jpeg;base64," + blobInfo.base64();
    success(img);
  },
  resize: false, // 禁止改变大小
  statusbar: false,

  // 设置 setup 回调以处理编辑器事件
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setup: (editor: any) => {
    editor.on("change", () => {
      model.value = editor.getContent();
      emit("change", editor.getContent());
    });
  }
};

const preventAutoFormat = (e: KeyboardEvent) => {
  // 在编辑器区域内阻止常见的格式化快捷键
  const editor = document.querySelector(".tox-edit-area__iframe");
  if (editor && document.activeElement === editor) {
    // 阻止常见的格式化快捷键 (Ctrl+Shift+F, Alt+Shift+F)
    if ((e.ctrlKey && e.shiftKey && e.key === "F") || (e.altKey && e.shiftKey && e.key === "F")) {
      e.preventDefault();
    }
  }
};

onMounted(() => {
  document.addEventListener("keydown", preventAutoFormat);
});

onBeforeUnmount(() => {
  // 移除监听
  document.removeEventListener("keydown", preventAutoFormat);
});
</script>

<style lang="scss">
:deep(#tinymce) {
  color: #ffffff !important;
}
.tox:not([dir="rtl"]) .tox-statusbar__branding {
  display: none;
}
.tox.tox-tinymce {
  border-color: #3e4049;
}
.tox .tox-dialog-wrap__backdrop {
  background-color: rgba(1, 1, 1, 0.1);
}
.tox .tox-edit-area__iframe {
  background-color: #0f1014 !important;
}
.tox .tox-tiered-menu .tox-selected-menu {
  min-width: 200px !important;
}
.tox .tox-toolbar,
.tox .tox-toolbar__primary,
.tox .tox-toolbar__overflow {
  background: linear-gradient(180deg, #8b58e7, #642cff);
}
.tox-tinymce-aux .tox-toolbar__overflow {
  top: calc(-500px - 210px) !important;
  max-width: 230px !important;
}
.tox .tox-tbtn--select {
  padding: 0px !important;
}

.tox-toolbar__primary {
  background-color: #3e4049 !important;
}
.tinymce-frame {
  padding: 0 5px;
  .tox-editor-container {
    .tox-toolbar,
    .tox-toolbar__primary,
    .tox-toolbar__overflow {
      background: #383b47;
    }
    .tox-toolbar__group:not(:last-of-type) {
      border-right: 1px solid #7d7d7d !important;
    }
    .tox-tbtn {
      cursor: pointer;
      &:hover {
        background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
      }
      &:focus {
        background: transparent;
      }
    }
    .tox-tbtn--enabled,
    .tox-tbtn--enabled:hover {
      background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    }
    .tox-tbtn svg {
      fill: #b4b7c1;
    }
    .tox-tbtn--disabled,
    .tox-tbtn--disabled:hover,
    .tox-tbtn:disabled,
    .tox-tbtn:disabled:hover {
      cursor: not-allowed;
      background: transparent;
      color: rgba(180, 183, 193, 0.5);
      svg {
        fill: rgba(180, 183, 193, 0.5);
      }
    }
    .tox-edit-area__iframe {
      background-color: #1a1e27;
    }
  }
  :deep(.el-form-item__label) {
    width: 65px !important;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding: 0;
  }
}
</style>
