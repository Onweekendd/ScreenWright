<template>
  <div class="ai-template-save">
    <div class="save-content" @click.stop>
      <el-form ref="formRef" :model="form" :rules="rules" :label-width="80">
        <el-form-item label="名称" prop="name">
          <sw-input style="height: 32px" v-model="form.name" placeholder="请输入模板名称" />
        </el-form-item>

        <el-form-item label="嵌入摘要" prop="embeddingText">
          <sw-input
            type="textarea"
            :rows="6"
            v-model="form.embeddingText"
            placeholder="用于语义检索的摘要原文，可描述该模板的用途、行业、风格等"
          />
        </el-form-item>

        <el-form-item label="语义标签" prop="tags">
          <el-select
            class="tags-select"
            popper-class="sw-select-dropdown"
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            :teleported="false"
            placeholder="输入后回车添加标签"
          />
        </el-form-item>

        <el-form-item label="模板范式" prop="payload">
          <div class="payload-editor">
            <MonacoEditor language="json" theme="sw-config-dark" v-model="form.payload" />
          </div>
        </el-form-item>
      </el-form>

      <!-- 大屏数据无需输入,确定时自动采集当前大屏并随表单一起提交 -->
      <div class="screen-data-tip">大屏数据将自动采集当前大屏内容，无需填写。</div>

      <div class="dialog-footer flex flex-end">
        <el-button class="cancel" type="default" @click="handleCancel">取消</el-button>
        <el-button class="check" type="primary" :loading="saving" @click="handleCheck">确定</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, reactive, ref, shallowRef } from "vue";

import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";

import { minioUploadFile } from "@/api/assets";
import { dialogInjectionKey } from "@/components/Dialog/constant";
import SwInput from "@/components/SwInput/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import type { LargeScreenAiConfig } from "@/model/AiTemplate";
import { captureEditorScreenShot } from "@/views/build/components/buildConfig/graphConfig/screenCapture";
import { assetsClassManager } from "@/views/build/components/buildTabs/selectAssets/assetsClass";
import { AssetsMenuKeyEnum } from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";
import { useCacheData } from "@/views/build/useCacheData";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import type AiTemplateClass from "./selectAssets/assetsClass/AiTemplateClass";

/** 预填值：AI 流程下由后端解析模板 JSON 得到（模板名称 / 嵌入摘要 / 语义标签 / 整份范式 JSON） */
interface PresetValues {
  name?: string;
  embeddingText?: string;
  tags?: string[];
  payload?: string;
}

const props = defineProps<{
  /** 预填字段；手动入口（资产面板「+」）不传，走原默认值 */
  presetValues?: PresetValues;
}>();

const emit = defineEmits<{
  /** 保存成功，透出后端返回的模板 ID */
  (e: "confirm", payload: { templateId?: number }): void;
  /** 用户取消保存 */
  (e: "cancel"): void;
}>();

// 两端复用：buildTabs 弹窗系统提供 dialogInjectionKey，agentBI 浮层则没有（返回 null，走 emits）。
const dialogCtx = inject(dialogInjectionKey, null);

const { buildWorkerCacheInput } = useCacheData();
const { navInfo } = useLargeScreenInfo();

const formRef = ref<FormInstance | null>(null);
const saving = ref(false);

const form = reactive({
  /** 模板名称，优先用预填值，否则取当前大屏名称 */
  name: props.presetValues?.name ?? navInfo.value.name ?? "",
  /** 嵌入摘要原文，送向量库做语义检索 */
  embeddingText: props.presetValues?.embeddingText ?? "",
  /** 语义标签，UI 用字符串数组维护，提交时序列化为 JSON 数组字符串 */
  tags: props.presetValues?.tags ? [...props.presetValues.tags] : ([] as string[]),
  /** 整份模板范式 JSON（范式描述+分辨率+插槽等），由代码编辑器维护 */
  payload: props.presetValues?.payload ?? ""
});

const rules = shallowRef<FormRules>({
  name: [{ required: true, message: "请输入模板名称", trigger: ["blur", "change"] }],
  payload: [
    {
      validator: (_rule, value: string, callback) => {
        if (!value || !value.trim()) {
          callback();
          return;
        }
        try {
          JSON.parse(value);
          callback();
        } catch {
          callback(new Error("模板范式需为合法 JSON"));
        }
      },
      trigger: ["blur"]
    }
  ]
});

/**
 * 默认封面：截取当前大屏并上传，返回 minio URL。
 * 截图/上传失败时回退到大屏背景图，不阻断保存。
 */
const captureCoverUrl = async (): Promise<string> => {
  try {
    const result = await captureEditorScreenShot({
      screenShotMode: "simple",
      canvas: "#go-chart-edit-content",
      mimeType: "image/jpeg"
    });
    if (!result) {
      return navInfo.value.backgroundUrl || "";
    }

    // 上传字段与构建页「封面截图」一致
    const formdata = new FormData();
    formdata.append("fileType", "1");
    formdata.append("resourceType", "1");
    formdata.append("largeId", `${navInfo.value.id}`);
    formdata.append("groupId", "");
    formdata.append("file", result.file);
    formdata.append("name", result.file.name);

    const res = await minioUploadFile(formdata);
    if (!res.success || !res.result?.url) {
      return navInfo.value.backgroundUrl || "";
    }
    return res.result.url;
  } catch (error) {
    console.error("生成大屏截图封面失败:", error);
    return navInfo.value.backgroundUrl || "";
  }
};

const handleCheck = async () => {
  if (saving.value) {
    return;
  }

  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }

  saving.value = true;
  try {
    // 大屏数据：采集方式与 useCacheData 传给 worker 的一致，stringify 后附带上去
    const screenData = JSON.stringify(buildWorkerCacheInput());

    // 默认封面使用当前大屏截图
    const coverUrl = await captureCoverUrl();

    const config: LargeScreenAiConfig = {
      name: form.name,
      embeddingText: form.embeddingText,
      tags: form.tags.length ? JSON.stringify(form.tags) : "",
      payload: form.payload,
      coverUrl,
      sourceLargeId: navInfo.value.id,
      sourceVersion: navInfo.value.versionCode,
      screenData
    };

    const aiTemplateClass = assetsClassManager.getAssetsClass(
      AssetsMenuKeyEnum.aiTemplate
    ) as unknown as AiTemplateClass;
    const saved = await aiTemplateClass.saveScreenTemplate(config);

    ElMessage.success("已保存为 AI 模板");
    // 两端通知：buildTabs 走 inject 的 confirm，agentBI 浮层走 emit
    dialogCtx?.confirm();
    emit("confirm", { templateId: saved?.id });
  } catch (error: any) {
    ElMessage.error(error?.message || "保存 AI 模板失败");
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  dialogCtx?.cancel();
  emit("cancel");
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.save-content {
  position: relative;
  z-index: 1;
  padding: 20px;
  border-radius: 8px;

  :deep(.el-form-item__label) {
    color: #fff;
  }
}

.tags-select {
  width: 100%;

  :deep(.el-tag) {
    background-color: rgba(139, 88, 231, 0.18);
    border-color: #642cff;
    color: #fff;

    .el-tag__close {
      color: #c6d0f5;

      &:hover {
        background-color: #642cff;
        color: #fff;
      }
    }
  }
}

.payload-editor {
  width: 100%;
  height: 440px;
  border: 1px solid #282e3a;
  border-radius: 4px;
  overflow: hidden;
}

.screen-data-tip {
  margin: 4px 0 16px 80px;
  color: #859094;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;

  .el-button {
    border-color: transparent;
    padding: 7px 15px;
    text-align: center;
    color: #ffffff;
    border-radius: 0;

    &.cancel {
      background-color: #3d404c;
      border-color: #3d404c;
    }

    &.check {
      border-color: #642cff;
      background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    }
  }
}
</style>
