import { computed, onMounted, reactive, ref } from "vue";

import { ElMessage, ElMessageBox } from "element-plus";

import {
  aiModelLabel,
  type AiModelVo,
  createAiModel,
  deleteAiModel,
  getAiModels,
  type ModelRole,
  reindexEmbeddings,
  setDefaultAiModel,
  testAiModel,
  updateAiModel,
  type VideoProvider
} from "@/api/aiModel";
import embeddingImage from "@/assets/image/models/embedding.png";
import imageImage from "@/assets/image/models/image.png";
import reasoningImage from "@/assets/image/models/reasoning.png";
import videoImage from "@/assets/image/models/video.png";

export interface RoleMeta {
  role: ModelRole;
  title: string;
  image: string;
  desc: string;
  /** video 的占位提示按服务商取，见 VIDEO_PROVIDERS */
  modelPlaceholder: string;
}

export const ROLE_META: RoleMeta[] = [
  {
    role: "reasoning",
    title: "推理模型",
    image: reasoningImage,
    desc: "主 Agent、子 Agent、标题、摘要压缩、编排、截图分析等一切文本推理。OpenAI 兼容端点。",
    modelPlaceholder: "deepseek-v4-flash"
  },
  {
    role: "embedding",
    title: "嵌入模型",
    image: embeddingImage,
    desc: "组件检索（RAG）向量化。全局只用默认那条，切换默认后需「重建索引」才生效。",
    modelPlaceholder: "BAAI/bge-large-zh-v1.5"
  },
  {
    role: "image",
    title: "生图模型",
    image: imageImage,
    desc: "效果图、装饰素材生成。需支持 images.generations 接口的 OpenAI 兼容端点。",
    modelPlaceholder: "留空需先联系模型服务商确认可用的生图模型 id"
  },
  {
    role: "video",
    title: "生视频模型",
    image: videoImage,
    desc: "文生视频、图生视频。先选服务商（接口协议），Base URL 可填接口前缀或完整提交地址。",
    modelPlaceholder: "MiniMax-H3"
  }
];

export interface VideoProviderMeta {
  value: VideoProvider;
  label: string;
  baseUrlPlaceholder: string;
  modelPlaceholder: string;
  testLabel: string;
  /** 测试按钮的代价说明 */
  testNote: string;
}

export const VIDEO_PROVIDERS: VideoProviderMeta[] = [
  {
    value: "minimax-v2",
    label: "MiniMax V2 网关",
    baseUrlPlaceholder: "https://llm-api.net/minimax/v2",
    modelPlaceholder: "MiniMax-H3 或 MiniMax-H3-Max",
    testLabel: "测试提交",
    testNote: "测试提交会生成一次 5 秒视频，可能产生费用"
  },
  {
    value: "runlive",
    label: "runlive 卡密接口",
    baseUrlPlaceholder: "https://www.runlive.top/mnmx",
    modelPlaceholder: "MiniMax-H3（仅作记录，模式按素材自动选）",
    testLabel: "测试连接",
    testNote: "API Key 填卡密钥；测试只查询一个不存在的任务，不扣积分"
  }
];

/** 空串或未知值按默认协议 minimax-v2 展示 */
export const videoProviderMeta = (provider: string): VideoProviderMeta =>
  VIDEO_PROVIDERS.find((p) => p.value === provider) ?? VIDEO_PROVIDERS[0];

const ROLE_TITLE = Object.fromEntries(ROLE_META.map((m) => [m.role, m.title])) as Record<ModelRole, string>;

/** 正在新增（还没落库）时的 editingId */
export const NEW_ID = "__new__";

/** 单条配置的可编辑表单 */
export interface ModelForm {
  /** 只有 video 可选，其余角色恒为空串 */
  provider: string;
  name: string;
  baseUrl: string;
  /** 空 = 不改动已存 key；占位符显示是否已配置 */
  apiKey: string;
  modelId: string;
  contextLength: number | undefined;
  dimensions: number | undefined;
}

interface RoleState {
  items: AiModelVo[];
  /** 正在编辑的配置 id；NEW_ID 表示新增 */
  editingId: string;
  form: ModelForm;
  /** 新增时没填 apiKey 就沿用这条已存配置的密钥（可跨角色） */
  copyKeyFrom: string | undefined;
  saving: boolean;
  testing: boolean;
  testResult: { ok: boolean; text: string } | null;
}

const defaultProvider = (role: ModelRole) => (role === "video" ? VIDEO_PROVIDERS[0].value : "");

const emptyForm = (role: ModelRole): ModelForm => ({
  provider: defaultProvider(role),
  name: "",
  baseUrl: "",
  apiKey: "",
  modelId: "",
  contextLength: undefined,
  dimensions: undefined
});

const toForm = (vo: AiModelVo): ModelForm => ({
  provider: vo.provider || defaultProvider(vo.role),
  name: vo.name,
  baseUrl: vo.baseUrl,
  apiKey: "",
  modelId: vo.modelId,
  contextLength: vo.contextLength ?? undefined,
  dimensions: vo.dimensions ?? undefined
});

const newRoleState = (role: ModelRole): RoleState => ({
  items: [],
  editingId: NEW_ID,
  form: emptyForm(role),
  copyKeyFrom: undefined,
  saving: false,
  testing: false,
  testResult: null
});

export function useAiModelSettings() {
  const loading = ref(true);
  const reindexing = ref(false);
  const states = reactive<Record<ModelRole, RoleState>>({
    reasoning: newRoleState("reasoning"),
    embedding: newRoleState("embedding"),
    image: newRoleState("image"),
    video: newRoleState("video")
  });

  /** 所有存了密钥的配置，供新增时「沿用已有密钥」选择 */
  const keySources = computed(() =>
    ROLE_META.flatMap(({ role }) =>
      states[role].items
        .filter((m) => m.hasApiKey)
        .map((m) => ({ id: m.id, label: `${ROLE_TITLE[m.role]} · ${aiModelLabel(m)}` }))
    )
  );

  const select = (role: ModelRole, id: string) => {
    const st = states[role];
    const vo = st.items.find((m) => m.id === id);
    if (!vo) {
      return;
    }
    st.editingId = id;
    st.form = toForm(vo);
    st.copyKeyFrom = undefined;
    st.testResult = null;
  };

  const startCreate = (role: ModelRole) => {
    const st = states[role];
    st.editingId = NEW_ID;
    st.form = emptyForm(role);
    st.copyKeyFrom = undefined;
    st.testResult = null;
  };

  /** 复制一条：表单预填，密钥沿用原条，改个模型 id 就能存 */
  const duplicate = (role: ModelRole, vo: AiModelVo) => {
    const st = states[role];
    st.editingId = NEW_ID;
    st.form = { ...toForm(vo), name: `${aiModelLabel(vo)} 副本` };
    st.copyKeyFrom = vo.hasApiKey ? vo.id : undefined;
    st.testResult = null;
  };

  let loadedOnce = false;

  /**
   * 重新拉列表，再决定每个角色选中哪条：
   * `focusId`（刚保存的那条）→ 当前选中的那条 → 正在填的新增表单保持不动 → 默认那条。
   */
  const load = async (focusId?: string) => {
    loading.value = true;
    try {
      const list = await getAiModels();
      for (const { role } of ROLE_META) {
        const st = states[role];
        st.items = list.filter((m) => m.role === role);
        const keep = st.items.find((m) => m.id === focusId) ?? st.items.find((m) => m.id === st.editingId);
        if (keep) {
          select(role, keep.id);
          continue;
        }
        if (loadedOnce && st.editingId === NEW_ID) {
          continue;
        }
        const fallback = st.items.find((m) => m.isDefault) ?? st.items[0];
        if (fallback) {
          select(role, fallback.id);
        } else {
          startCreate(role);
        }
      }
      loadedOnce = true;
    } catch (e) {
      ElMessage.error(`加载模型配置失败：${(e as Error).message}`);
    } finally {
      loading.value = false;
    }
  };

  const buildBody = (role: ModelRole, f: ModelForm) => ({
    ...(role === "video" ? { provider: f.provider } : {}),
    name: f.name.trim(),
    baseUrl: f.baseUrl.trim(),
    apiKey: f.apiKey.trim() || undefined,
    modelId: f.modelId.trim(),
    ...(role === "reasoning" ? { contextLength: f.contextLength ?? null } : {}),
    ...(role === "embedding" ? { dimensions: f.dimensions ?? null } : {})
  });

  const warnReindex = () => ElMessage.warning("默认嵌入模型已变更，请点「重建索引」后再使用组件检索");

  const save = async (role: ModelRole) => {
    const st = states[role];
    if (!st.form.modelId.trim()) {
      ElMessage.warning("请填写模型 id");
      return;
    }
    st.saving = true;
    try {
      const body = buildBody(role, st.form);
      const vo =
        st.editingId === NEW_ID
          ? await createAiModel({ role, ...body, copyKeyFrom: st.copyKeyFrom })
          : await updateAiModel(st.editingId, body);
      ElMessage.success("已保存");
      if (role === "embedding" && vo.isDefault) {
        warnReindex();
      }
      await load(vo.id);
    } catch (e) {
      ElMessage.error(`保存失败：${(e as Error).message}`);
    } finally {
      st.saving = false;
    }
  };

  const setDefault = async (role: ModelRole, id: string) => {
    try {
      await setDefaultAiModel(id);
      if (role === "embedding") {
        warnReindex();
      }
      await load();
    } catch (e) {
      ElMessage.error(`设置默认失败：${(e as Error).message}`);
    }
  };

  const remove = async (vo: AiModelVo) => {
    try {
      await ElMessageBox.confirm(`删除「${aiModelLabel(vo)}」？正在使用它的对话会回到默认模型。`, "删除模型配置", {
        type: "warning",
        confirmButtonText: "删除",
        cancelButtonText: "取消"
      });
    } catch {
      return;
    }
    try {
      await deleteAiModel(vo.id);
      ElMessage.success("已删除");
      // 删的是正在编辑的那条时，load 找不到它会回落到默认
      await load();
    } catch (e) {
      ElMessage.error(`删除失败：${(e as Error).message}`);
    }
  };

  const test = async (role: ModelRole) => {
    const st = states[role];
    st.testing = true;
    st.testResult = null;
    try {
      const r = await testAiModel(role, {
        id: st.editingId === NEW_ID ? st.copyKeyFrom : st.editingId,
        ...(role === "video" ? { provider: st.form.provider } : {}),
        baseUrl: st.form.baseUrl.trim(),
        apiKey: st.form.apiKey.trim() || undefined,
        modelId: st.form.modelId.trim(),
        ...(role === "embedding" ? { dimensions: st.form.dimensions ?? null } : {})
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

  /** API Key 输入框占位：告诉用户留空会发生什么 */
  const apiKeyPlaceholder = (role: ModelRole) => {
    const st = states[role];
    if (st.editingId !== NEW_ID) {
      return st.items.find((m) => m.id === st.editingId)?.hasApiKey ? "已配置，留空则不改动" : "未配置";
    }
    const source = keySources.value.find((s) => s.id === st.copyKeyFrom);
    return source ? `留空则沿用「${source.label}」的密钥` : "请输入 API Key";
  };

  onMounted(() => load());

  return {
    apiKeyPlaceholder,
    duplicate,
    keySources,
    loading,
    reindex,
    reindexing,
    remove,
    save,
    select,
    setDefault,
    startCreate,
    states,
    test
  };
}
