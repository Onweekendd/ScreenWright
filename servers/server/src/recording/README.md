# src/recording —— LLM 往返录制

把「发给模型的真实请求体」和「模型返回的原始 SSE」成对存档，供离线排障与评估。

框架无关：Mastra 的 BI 对话和 artifact-app 的 Pi 编码 agent 都在 **HTTP fetch 层**取样，落地的都是
OpenAI chat-completions 的 wire 格式，因此共用这一套契约、编号、sink 与索引，不需要任何格式转换。

```
入口注入 turn 上下文 ──▶ fetch 层取样(tee/clone) ──▶ ExchangeArchive ──┬─▶ step_NN.json（recordStore：fs 恒写，可选镜像 MinIO）
   recording-scope           recording-fetch        exchange-archive  └─▶ DB 索引一行（有 threadId 就写）
```

## 每个文件干什么

| 文件 | 职责 | 主要导出 |
| --- | --- | --- |
| `exchange-record.ts` | **契约**。定义档案格式 `ExchangeRecord`（字段顺序即落盘顺序，新增只能往后追加）、token 用量与摘要结构、格式版本，以及总开关。不依赖本目录任何其他文件。 | `ExchangeRecord`、`ExchangeSource`、`TokenUsage`、`ExchangeSummary`、`EXCHANGE_FORMAT_VERSION`、`isLlmRecordingEnabled()` |
| `recording-scope.ts` | **归属与编号**。用 `AsyncLocalStorage` 记住「当前是哪个 thread、第几个 turn、记到第几 step」，让深层的 fetch 层不必逐层传参。turn 规则：无 `runId`（new）开新 turn，带 `runId`（resume）沿用当前 turn 且 step 继续递增；进程内存丢失时从已落地的 `turn_NN` / `step_NN` 反推续接。 | `withRecordingTurn()`（唯一入口）、`prepareRecordingTurn()`、`allocateStepSlot()`、`StepSlot` |
| `recording-fetch.ts` | **取样**。拿到响应后复写一份给档案，正本原样交还下游：流式用 `res.body.tee()`，非流式用 `res.clone()`。两种接法——provider 已自己发过请求的用 `recordExchange()`，需要一个可注入 fetch 的用 `createRecordingFetch()`。 | `recordExchange()`、`createRecordingFetch()`、`RecordExchangeInput`、`FetchFunction` |
| `exchange-archive.ts` | **记录类**。唯一的落盘入口，与来源无关：`open()` 在响应刚到手时同步占住 step 槽位、定下文件名，`commit(raw)` 在响应抽干后解析、写 `step_NN.json`、写索引。写盘失败只打日志，绝不影响主流程。 | `ExchangeArchive`、`ExchangeHead`、`OpenExchange` |
| `openai-sse.ts` | **解析**。只认 OpenAI wire 格式，不认任何 agent 框架的类型：把 SSE 拆成 JSON 数组、把逐帧 delta 拼回 reasoning / 正文 / tool_calls（工具参数按 id + index 拼片）、从最后一份非空 usage 取 token 数（兼容多种字段命名）。 | `summarizeResponse()`、`extractTokenUsage()`、`formatResponse()`、`drainToText()`、`safeParse()` |
| `record-sink.ts` | **落盘目标**。把记录交给 `@/lib/storage` 的 `recordStore()`（fs 恒写，`RECORD_SINK=both` 且 MinIO 已配置时额外镜像）。key 规则 `<RECORD_PREFIX>/<threadId>/turn_00/step_00.json`，fs 与 MinIO 共用同一份 key。`listChildren()` 供跨重启续接序号用。 | `writeRecord()`、`listChildren()`、`joinKey()`、`recordKey()`、`RECORD_PREFIX` |
| `record-index.ts` | **可查询索引**。每次往返在 DB `llm_exchange_records` 写一行（按 `threadId + turnIndex + step` upsert，幂等），只存能筛选的字段加一个指向正文的 `objectKey`（fs 与 MinIO 共用）。只要有 `threadId` 就写——正文恒在本地，agent-trace 与 L2 指标都从这张表读。`bucket` 仅在镜像了 MinIO 时有值。 | `indexLlmExchange()`、`LlmExchangeIndexInput` |

依赖方向自上而下：适配层 → `recording-fetch` → `exchange-archive` → `recording-scope` / `openai-sse` / `record-sink` / `record-index`，`exchange-record` 谁都可以依赖。

## 两套 agent 怎么接进来

|  | Mastra · BI 对话 | Pi · 编码 agent |
| --- | --- | --- |
| 进 turn | `BIChatStreamSession.runTurnWithRecording()` 用 `withRecordingTurn()` 包住整轮（**建流 + 消费流都要在里面**，模型往返是消费流时才发生的） | `agent/record/pi-recording-turn.ts` 的 `runInPiRecordingTurn()` 包住一次 `PiAgentRunner.run()` |
| 取样 | `mastra/provider/utils.ts` 的 `finalizeReasoningResponse()` 调 `recordExchange()` | `agent/record/pi-recording-provider.ts` 的 `withExchangeRecording()` 把 `createRecordingFetch()` 注入 pi-ai 的 `options.fetch` |
| 案卷号 | `threadId` | `pi-{appId}-{taskListId}` |
| 一个 turn | 一次提问（含 resume 续接） | 一次 `run()`（执行一个编码任务） |

## 开关

| 环境变量 | 作用 | 默认 |
| --- | --- | --- |
| `RECORD_LLM` | 总开关，`true` 才录 | 关 |
| `RECORD_SINK` | `fs` 只写本地 / `both` 本地为主 + 镜像 MinIO（需 MinIO 已配置，否则静默降级为 `fs`） | `fs` |
| `LLM_RECORD_DIR` | 本地根目录（fs 恒用） | `<cwd>/.data/records` |
| `LLM_RECORD_MINIO_PREFIX` | 记录 key 的业务前缀（fs 与 MinIO 共用；eval 覆盖为 `eval-records`） | `llm-records` |

## 注意

- `request` 字段是**完整请求体**：system prompt、用户业务数据、全部工具定义都在里面。录制目录、MinIO 桶与 `/customApi/llm-exchanges` 接口按敏感数据管控。
- 根前缀下出现 `step_-1.json`，说明那次模型调用跑在 turn 上下文之外（漏了 enter，或跨了 worker / 后台边界）。
- turn / step 序号是进程内内存态，只对单实例部署安全。
