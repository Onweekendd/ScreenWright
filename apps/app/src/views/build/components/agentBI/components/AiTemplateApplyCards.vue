<template>
  <div class="ai-template-apply" @click.stop>
    <div class="apply-header">
      <span class="title">选择要应用的模板</span>
      <span class="subtitle">AI 为你推荐了以下模板，选择一个应用到当前大屏</span>
    </div>

    <div v-if="loading" class="apply-state">正在加载候选模板…</div>
    <div v-else-if="!templates.length" class="apply-state">未找到可应用的模板</div>

    <div v-else class="apply-list">
      <div v-for="tpl in templates" :key="tpl.id" class="apply-card">
        <div class="cover">
          <img v-if="tpl.coverUrl" :src="tpl.coverUrl" :alt="tpl.name" />
          <div v-else class="cover-empty">无封面</div>
        </div>
        <div class="info">
          <div class="name" :title="tpl.name">{{ tpl.name || `模板 ${tpl.id}` }}</div>
          <div class="scene" :title="tpl.scene">{{ tpl.scene || "暂无适用场景说明" }}</div>
          <div v-if="tpl.tags.length" class="tags">
            <span v-for="t in tpl.tags.slice(0, 6)" :key="t" class="tag">{{ t }}</span>
          </div>
        </div>
        <el-button
          class="apply-btn"
          type="primary"
          size="small"
          :loading="applyingId === tpl.id"
          :disabled="applyingId !== null && applyingId !== tpl.id"
          @click="handleApply(tpl)"
        >
          应用
        </el-button>
      </div>
    </div>

    <div class="apply-footer flex flex-end">
      <el-button class="cancel" type="default" :disabled="applyingId !== null" @click="emit('cancel')">取消</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import { ElMessage } from "element-plus";

import { queryAiTemplateById } from "@/api/aiTemplate";
import type { LargeScreenAiConfig } from "@/model/AiTemplate";
import to from "@/utils/await-to-js";
import { setMinioUrl } from "@/utils/config";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

/** 候选卡片的展示数据（在原始 config 之外补好封面/标签/场景的可渲染形态） */
interface TemplateCard {
  id: number;
  name: string;
  coverUrl: string;
  scene: string;
  tags: string[];
  /** 应用时直接复用，避免再次请求详情 */
  config: LargeScreenAiConfig;
}

const props = defineProps<{
  /** 候选模板 id（由后端 apply_ai_template suspend 透传，来自 bi_search_template 检索） */
  templateIds: number[];
}>();

const emit = defineEmits<{
  /** 用户应用了某模板，透出模板 id 与回写的范式描述文件路径 */
  (e: "apply", payload: { templateId: number; describePath: string }): void;
  /** 用户取消应用 */
  (e: "cancel"): void;
}>();

const { applyAiTemplate } = useTabsMenuGroup();

const loading = ref(true);
const templates = ref<TemplateCard[]>([]);
/** 正在应用的模板 id；非空时锁定其余卡片，避免并发应用 */
const applyingId = ref<number | null>(null);

/** tags 字段后端存为 JSON 数组字符串，容错解析为字符串数组 */
const parseTags = (raw?: string): string[] => {
  if (!raw) {
    return [];
  }
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
};

/** 适用场景：优先用 info 表的 scene，缺省时回退到范式 JSON 的「适配场景」 */
const resolveScene = (config: LargeScreenAiConfig): string => {
  if (config.scene?.trim()) {
    return config.scene;
  }
  try {
    const payload = JSON.parse(config.payload ?? "{}") as Record<string, unknown>;
    const scene = payload["适配场景"];
    return typeof scene === "string" ? scene : "";
  } catch {
    return "";
  }
};

onMounted(async () => {
  const results = await Promise.all(props.templateIds.map((id) => to(queryAiTemplateById(id))));
  templates.value = results
    .map(([err, res]) => (err || !res?.success ? null : res.result))
    .filter((config): config is LargeScreenAiConfig => !!config?.id)
    .map((config) => ({
      id: config.id!,
      name: config.name ?? "",
      coverUrl: config.coverUrl ? setMinioUrl(config.coverUrl) : "",
      scene: resolveScene(config),
      tags: parseTags(config.tags),
      config
    }));
  loading.value = false;
});

const handleApply = async (tpl: TemplateCard) => {
  if (applyingId.value !== null) {
    return;
  }
  applyingId.value = tpl.id;
  try {
    const describePath = await applyAiTemplate(tpl.config);
    if (!describePath) {
      // applyAiTemplate 内部已 ElMessage 报错，保留弹窗让用户重试或取消
      return;
    }
    ElMessage.success("已应用模板");
    emit("apply", { templateId: tpl.id, describePath });
  } finally {
    applyingId.value = null;
  }
};
</script>

<style lang="scss" scoped>
.ai-template-apply {
  padding: 16px;
  background-color: var(--sw-panel-bg);
  border: 1px solid color-mix(in srgb, var(--sw-theme-color) 50%, transparent);
  border-radius: 10px;
}

.apply-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;

  .title {
    color: #fff;
    font-size: 14px;
    font-weight: 600;
  }

  .subtitle {
    color: #859094;
    font-size: 12px;
  }
}

.apply-state {
  padding: 24px 0;
  color: #859094;
  font-size: 13px;
  text-align: center;
}

.apply-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 52vh;
  overflow-y: auto;
}

.apply-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background-color: #2b2f3a;
  border: 1px solid #3d404c;
  border-radius: 8px;

  .cover {
    flex: 0 0 120px;
    width: 120px;
    height: 68px;
    border-radius: 4px;
    overflow: hidden;
    background-color: #1c1f27;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cover-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #5c6370;
      font-size: 12px;
    }
  }

  .info {
    flex: 1;
    min-width: 0;

    .name {
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .scene {
      margin-top: 4px;
      color: #97a0b3;
      font-size: 12px;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;

      .tag {
        padding: 1px 8px;
        background-color: color-mix(in srgb, var(--sw-theme-color) 18%, transparent);
        border: 1px solid var(--sw-theme-color);
        border-radius: 10px;
        color: #c6d0f5;
        font-size: 11px;
      }
    }
  }

  .apply-btn {
    flex: 0 0 auto;
    border-color: var(--sw-theme-color);
    background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
  }
}

.apply-footer {
  margin-top: 12px;

  .cancel {
    background-color: #3d404c;
    border-color: #3d404c;
    color: #fff;
  }
}
</style>
