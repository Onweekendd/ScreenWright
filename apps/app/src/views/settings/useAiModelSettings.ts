import { onMounted, reactive, ref } from "vue";

import { ElMessage } from "element-plus";

import {
  type AiModelVo,
  getAiModels,
  type ModelRole,
  reindexEmbeddings,
  testAiModel,
  updateAiModel
} from "@/api/aiModel";

export interface RoleMeta {
  role: ModelRole;
  title: string;
  desc: string;
  modelPlaceholder: string;
}

export const ROLE_META: RoleMeta[] = [
  {
    role: "reasoning",
    title: "推理模型",
    desc: "主 Agent、子 Agent、标题、摘要压缩、编排、截图分析等一切文本推理。OpenAI 兼容端点。",
    modelPlaceholder: "deepseek-v4-flash"
  },
  {
    role: "vision",
    title: "视觉模型",
    desc: "识图：视觉分析 Agent、语义布局 Agent。需支持图片输入的多模态模型。",
    modelPlaceholder: "gemini-3.1-flash-lite"
  },
  {
    role: "embedding",
    title: "嵌入模型",
    desc: "组件检索（RAG）向量化。改动后需「重建索引」才生效。",
    modelPlaceholder: "BAAI/bge-large-zh-v1.5"
  }
];

/** 单个角色的可编辑表单 */
export interface RoleForm {
  baseUrl: string;
  /** 空 = 不改动已存 key；占位符显示脱敏值 */
  apiKey: string;
  modelId: string;
  contextLength: number | undefined;
  dimensions: number | undefined;
}

interface RoleState {
  vo: AiModelVo;
  form: RoleForm;
  saving: boolean;
  testing: boolean;
  testResult: { ok: boolean; text: string } | null;
}

export function useAiModelSettings() {
  const loading = ref(true);
  const reindexing = ref(false);
  const states = reactive<Record<ModelRole, RoleState | null>>({
    reasoning: null,
    vision: null,
    embedding: null
  });

  const toForm = (vo: AiModelVo): RoleForm => ({
    baseUrl: vo.baseUrl,
    apiKey: "",
    modelId: vo.modelId,
    contextLength: vo.contextLength ?? undefined,
    dimensions: vo.dimensions ?? undefined
  });

  const load = async () => {
    loading.value = true;
    try {
      const list = await getAiModels();
      for (const vo of list) {
        states[vo.role] = { vo, form: toForm(vo), saving: false, testing: false, testResult: null };
      }
    } catch (e) {
      ElMessage.error(`加载模型配置失败：${(e as Error).message}`);
    } finally {
      loading.value = false;
    }
  };

  const buildBody = (role: ModelRole, f: RoleForm) => ({
    baseUrl: f.baseUrl.trim(),
    apiKey: f.apiKey.trim() || undefined,
    modelId: f.modelId.trim(),
    ...(role === "reasoning" ? { contextLength: f.contextLength ?? null } : {}),
    ...(role === "embedding" ? { dimensions: f.dimensions ?? null } : {})
  });

  const save = async (role: ModelRole) => {
    const st = states[role];
    if (!st) {
      return;
    }
    if (!st.form.modelId.trim()) {
      ElMessage.warning("请填写模型 id");
      return;
    }
    st.saving = true;
    try {
      const vo = await updateAiModel(role, buildBody(role, st.form));
      st.vo = vo;
      st.form = toForm(vo);
      st.testResult = null;
      ElMessage.success("已保存");
      if (role === "embedding") {
        ElMessage.warning("嵌入模型已变更，请点「重建索引」后再使用组件检索");
      }
    } catch (e) {
      ElMessage.error(`保存失败：${(e as Error).message}`);
    } finally {
      st.saving = false;
    }
  };

  const test = async (role: ModelRole) => {
    const st = states[role];
    if (!st) {
      return;
    }
    st.testing = true;
    st.testResult = null;
    try {
      const r = await testAiModel(role, {
        baseUrl: st.form.baseUrl.trim(),
        apiKey: st.form.apiKey.trim() || undefined,
        modelId: st.form.modelId.trim()
      });
      st.testResult = r.ok
        ? { ok: true, text: `连接正常（${r.latencyMs}ms）` }
        : { ok: false, text: r.error || "连接失败" };
    } catch (e) {
      st.testResult = { ok: false, text: (e as Error).message };
    } finally {
      st.testing = false;
    }
  };

  const reindex = async () => {
    reindexing.value = true;
    try {
      const r = await reindexEmbeddings();
      ElMessage.success(`索引重建完成：${r.embedded} 条${r.failed ? `，${r.failed} 条失败` : ""}`);
    } catch (e) {
      ElMessage.error(`重建失败：${(e as Error).message}`);
    } finally {
      reindexing.value = false;
    }
  };

  onMounted(load);

  return { loading, reindexing, states, save, test, reindex };
}
