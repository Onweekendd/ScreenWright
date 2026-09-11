import {
  type CreateAgentSessionOptions,
  type CreateModelRuntimeOptions,
  ModelRuntime
} from "@earendil-works/pi-coding-agent";

import { withExchangeRecording } from "@/artifact-app/agent/record/pi-recording-provider";
import { isLlmRecordingEnabled } from "@/recording/exchange-record";

const DEEPSEEK_PROVIDER_ID = "deepseek";
const DEEPSEEK_FLASH_MODEL_ID = "deepseek-v4-flash";

type PiModel = NonNullable<CreateAgentSessionOptions["model"]>;

export interface CreatePiModelRuntimeInput {
  /** 推理模型 API Key（ai_model 表 reasoning 行），由应用启动层读取配置后注入。 */
  readonly apiKey: string;

  /** 自定义 endpoint；省略时用 Pi 内置 deepseek provider 的默认地址。 */
  readonly baseUrl?: string;

  /** 模型 id；Pi 的 deepseek catalog 不认识时回退 deepseek-v4-flash。 */
  readonly modelId?: string;

  /** Pi ModelRuntime 的可选创建参数。 */
  readonly runtimeOptions?: CreateModelRuntimeOptions;
}

export interface PiModelRuntime {
  /** 供所有 Pi Session 共享的模型运行环境。 */
  readonly modelRuntime: ModelRuntime;

  /** Artifact App Pi Agent 固定使用的 DeepSeek Flash 模型。 */
  readonly model: PiModel;
}

/**
 * 创建 Artifact App 共用的 Pi ModelRuntime 和模型。
 *
 * 本函数不在模块导入阶段执行。应用启动层应调用一次并将返回结果注入
 * PiSessionFactory，从而让不同 Session 复用同一个 ModelRuntime。
 */
export async function createPiModelRuntime(input: CreatePiModelRuntimeInput): Promise<PiModelRuntime> {
  const modelRuntime = await ModelRuntime.create(input.runtimeOptions);
  enableExchangeRecording(modelRuntime);

  // 自定义 endpoint：把 baseUrl/apiKey 叠到内置 deepseek provider 上（保留其模型 catalog）。
  const baseUrl = input.baseUrl?.trim();
  if (baseUrl) {
    modelRuntime.registerProvider(DEEPSEEK_PROVIDER_ID, { baseUrl, apiKey: input.apiKey });
  }

  const wantedModelId = input.modelId?.trim() || DEEPSEEK_FLASH_MODEL_ID;
  const model =
    modelRuntime.getModel(DEEPSEEK_PROVIDER_ID, wantedModelId) ??
    modelRuntime.getModel(DEEPSEEK_PROVIDER_ID, DEEPSEEK_FLASH_MODEL_ID);

  if (!model) {
    throw new Error(`Model ${DEEPSEEK_PROVIDER_ID}/${wantedModelId} 未注册，且回退 ${DEEPSEEK_FLASH_MODEL_ID} 也不存在`);
  }

  // apiKey 可能为空（装机版首启还没配模型）：仍然设置，实际调用时由 Pi 报鉴权错。
  await modelRuntime.setRuntimeApiKey(DEEPSEEK_PROVIDER_ID, input.apiKey);

  return { modelRuntime, model };
}

/**
 * 开启 LLM 录制时，用包了一层的 provider 覆盖内置 deepseek（同 id 注册，由 runtime 重新组合）。
 * 未开启录制、或 runtime 里没有该 provider 时什么都不做，Pi 的行为与之前完全一致。
 */
function enableExchangeRecording(modelRuntime: ModelRuntime): void {
  if (!isLlmRecordingEnabled()) {
    return;
  }

  const provider = modelRuntime.getProvider(DEEPSEEK_PROVIDER_ID);
  if (!provider) {
    return;
  }

  modelRuntime.registerNativeProvider(withExchangeRecording(provider));
}
