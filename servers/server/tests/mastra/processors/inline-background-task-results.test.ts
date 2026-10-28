import type { MastraDBMessage } from "@mastra/core/agent";
import { MessageList } from "@mastra/core/agent";
import type { ProcessorMessageContext } from "@mastra/core/processors";
import { describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({ listTasks: vi.fn(), getStore: vi.fn() }));
// memory 只给默认台账用：查不到 thread 就当没有要补报的，不影响其它用例
vi.mock("@/mastra/storage/storage", () => ({
  storage: { getStore: storageMocks.getStore },
  memory: { getThreadById: vi.fn(), updateThread: vi.fn() }
}));

import type { BackgroundTaskNoticeLedger, FinishedBackgroundTask } from "@/mastra/processors/background-task-notices";
import {
  type BackgroundTaskLookup,
  catchUpNote,
  delegatedTaskIds,
  directiveToolCallIds,
  imageMimeOf,
  InlineBackgroundTaskResults,
  lookupBackgroundTaskInStorage,
  parseEntries,
  pendingCallsNote,
  pendingSuspendedCalls,
  resultFromHistory,
  rewriteDirectiveText,
  summarizeResult
} from "@/mastra/processors/inlineBackgroundTaskResults";

/** Mastra 1.66 buildContinuationDirective 的原文（开头有个空格，末尾有空格） */
const COMPLETED =
  " IMPORTANT: The following tool-call IDs completed successfully: call_a (createImageTool). " +
  "Their results are now in the conversation. Do not call the same tool again — the result is already available. ";
const FAILED =
  " IMPORTANT: The following tool-call IDs failed: call_b (createVideoTool). " +
  "Their failure information is now in the conversation. Do not retry these tools unless the user explicitly requests it. ";

const imageResult = {
  id: "img-1",
  url: "http://localhost:4111/blobs/generated-images/a.png",
  reused: false,
  libraryFileId: 8,
  imagesForModel: [{ url: "http://localhost:4111/blobs/generated-images/a.png", label: "生成的图片 1465×1074" }]
};

const lookupReturning =
  (tasks: Record<string, { status: string; result?: unknown; error?: { message: string } }>): BackgroundTaskLookup =>
  async (toolCallId) =>
    tasks[toolCallId] ?? null;

const invocation = (toolCallId: string, result: unknown) =>
  ({
    id: `m-${toolCallId}`,
    role: "assistant",
    content: {
      format: 2,
      parts: [
        {
          type: "tool-invocation",
          toolInvocation: { toolCallId, toolName: "createImageTool", state: "result", args: {}, result }
        }
      ]
    }
  }) as unknown as MastraDBMessage;

const SUSPENDED =
  " IMPORTANT: The following tool-call IDs are suspended: call_00 (agent-swExecutorAgent). " +
  "Do not attempt to resume them; let the user know they are waiting for explicit resume input.";

/** 主 agent 委派施工的调用：任务号写在入参 prompt 的 <pending_task_ids> 里 */
const delegation = (toolCallId: string, ...taskIds: string[]) =>
  ({
    id: `m-${toolCallId}`,
    role: "assistant",
    content: {
      format: 2,
      parts: [
        {
          type: "tool-invocation",
          toolInvocation: {
            toolCallId,
            toolName: "agent-swExecutorAgent",
            state: "result",
            args: {
              prompt: `<delegation>\n  <task_list_id>t1</task_list_id>\n  <pending_task_ids>\n${taskIds
                .map((id) => `    <id>${id}</id>`)
                .join("\n")}\n  </pending_task_ids>\n</delegation>`
            },
            result: "Background task started."
          }
        }
      ]
    }
  }) as unknown as MastraDBMessage;

/** 真实的 MessageList：历史走 memory，续接指令走 context，和 Mastra 续接轮一致 */
const listWith = (history: MastraDBMessage[], directive: string) => {
  const list = new MessageList({ threadId: "t1", resourceId: "5" });
  list.add(history, "memory");
  list.add([{ role: "user", content: directive }], "context");
  return list;
};

const run = (processor: InlineBackgroundTaskResults, messageList: MessageList) =>
  processor.processInputStep({ messageList } as unknown as ProcessorMessageContext);

const directiveText = (list: MessageList) => {
  const message = list.get.all.db().find((m) => m.role === "user")!;
  return message.content.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
};

describe("imageMimeOf", () => {
  it("按扩展名给具体类型，带查询串也认，认不出的按 png", () => {
    expect(imageMimeOf("http://x/a.png")).toBe("image/png");
    expect(imageMimeOf("http://x/a.JPG?sig=1")).toBe("image/jpeg");
    expect(imageMimeOf("http://x/a.jpeg")).toBe("image/jpeg");
    expect(imageMimeOf("http://x/a.webp")).toBe("image/webp");
    expect(imageMimeOf("http://x/blob")).toBe("image/png");
  });
});

describe("parseEntries", () => {
  it("拆出 toolCallId 和工具名；没有工具名的也认", () => {
    expect(parseEntries("call_a (createImageTool), call_b")).toEqual([
      { toolCallId: "call_a", toolName: "createImageTool" },
      { toolCallId: "call_b", toolName: undefined }
    ]);
  });

  it("空串得到空列表", () => {
    expect(parseEntries("")).toEqual([]);
  });
});

describe("summarizeResult", () => {
  it("保留 id / url，imagesForModel 只留说明（实际尺寸），不重复 url", () => {
    const text = summarizeResult(imageResult);

    expect(text).toContain(imageResult.url);
    expect(text).toContain("img-1");
    expect(text).toContain("生成的图片 1465×1074");
    expect(text).not.toContain("imagesForModel");
    expect(text.split(imageResult.url)).toHaveLength(2);
  });

  it("库里存的是 JSON 字符串也能解开", () => {
    expect(summarizeResult(JSON.stringify({ url: "http://x/a.mp4" }))).toBe('{"url":"http://x/a.mp4"}');
  });

  it("纯文本原样给，过长的截断", () => {
    expect(summarizeResult("完成")).toBe("完成");
    expect(summarizeResult("x".repeat(5000))).toMatch(/…（已截断）$/);
    expect(summarizeResult("x".repeat(5000)).length).toBeLessThan(1300);
  });
});

describe("resultFromHistory", () => {
  it("取历史里被替换过的真实结果", () => {
    expect(resultFromHistory([invocation("call_a", imageResult)], "call_a")).toEqual(imageResult);
  });

  it("还是占位（没被替换）就当没有", () => {
    const placeholder = "Background task started. Task ID: x. The tool is running in the background.";

    expect(resultFromHistory([invocation("call_a", placeholder)], "call_a")).toBeUndefined();
    expect(resultFromHistory([invocation("call_a", "[后台任务运行中] taskId=x")], "call_a")).toBeUndefined();
  });

  it("找不到这个调用", () => {
    expect(resultFromHistory([], "call_a")).toBeUndefined();
  });
});

/** 只看改写后的文字；要看图片时直接调 rewriteDirectiveText */
const rewriteText = async (...args: Parameters<typeof rewriteDirectiveText>) =>
  (await rewriteDirectiveText(...args))?.text ?? null;

describe("rewriteDirectiveText", () => {
  it("原提示保留，后面带上每个完成任务的结果", async () => {
    const text = await rewriteText(
      COMPLETED,
      lookupReturning({ call_a: { status: "completed", result: imageResult } }),
      []
    );

    expect(text).toContain("The following tool-call IDs completed successfully: call_a");
    expect(text).toContain("〔后台任务结果〕");
    expect(text).toContain("createImageTool（call_a） 已完成，结果：");
    expect(text).toContain(imageResult.url);
  });

  it("失败的带上失败原因", async () => {
    const text = await rewriteText(
      FAILED,
      lookupReturning({ call_b: { status: "failed", error: { message: "内容审核未通过" } } }),
      []
    );

    expect(text).toContain("createVideoTool（call_b）失败：内容审核未通过");
  });

  it("完成和失败同在一条提示里时都补上", async () => {
    const text = await rewriteText(
      COMPLETED + FAILED,
      lookupReturning({
        call_a: { status: "completed", result: imageResult },
        call_b: { status: "failed", error: { message: "超时" } }
      }),
      []
    );

    expect(text).toContain("call_a） 已完成");
    expect(text).toContain("call_b）失败：超时");
  });

  it("任务表里没有就退回历史里被替换的结果", async () => {
    const text = await rewriteText(COMPLETED, lookupReturning({}), [invocation("call_a", imageResult)]);

    expect(text).toContain(imageResult.url);
  });

  it("两处都取不到时明说没取回，叫模型别重复调用", async () => {
    const text = await rewriteText(COMPLETED, lookupReturning({}), []);

    expect(text).toContain("没能取回结果内容");
    expect(text).toContain("不要重复调用");
  });

  it("查任务表本身出错（库连不上）也不影响续接，按没取到处理", async () => {
    const broken: BackgroundTaskLookup = async () => {
      throw new Error("db down");
    };

    await expect(rewriteText(COMPLETED, broken, [])).resolves.toContain("没能取回结果内容");
  });

  it("已经改写过的不再改（processInputStep 每一步都跑）", async () => {
    const once = await rewriteText(COMPLETED, lookupReturning({}), []);

    expect(await rewriteText(once!, lookupReturning({}), [])).toBeNull();
  });

  it("结果里的图片单独交出来（模型要「看」，不能只给 url 文本）", async () => {
    const result = await rewriteDirectiveText(
      COMPLETED,
      lookupReturning({ call_a: { status: "completed", result: imageResult } }),
      []
    );

    expect(result!.images).toEqual(imageResult.imagesForModel);
    expect(result!.text).toContain("生成的图片已按顺序附在本条消息后面");
    expect(result!.text).toContain("[1] 生成的图片 1465×1074");
  });

  it("视频这类没有图的结果不附图，也不提「图片已附上」", async () => {
    const result = await rewriteDirectiveText(
      COMPLETED,
      lookupReturning({ call_a: { status: "completed", result: { id: "v1", url: "http://x/a.mp4" } } }),
      []
    );

    expect(result!.images).toEqual([]);
    expect(result!.text).not.toContain("附在本条消息后面");
  });

  it("图片最多附最近 3 张，和工具图的上限一致", async () => {
    const many = {
      url: "http://x/last.png",
      imagesForModel: Array.from({ length: 5 }, (_, i) => ({ url: `http://x/${i}.png`, label: `图${i}` }))
    };

    const result = await rewriteDirectiveText(
      COMPLETED,
      lookupReturning({ call_a: { status: "completed", result: many } }),
      []
    );

    expect(result!.images.map((image) => image.url)).toEqual(["http://x/2.png", "http://x/3.png", "http://x/4.png"]);
  });

  it("库里存成 JSON 字符串的结果也能取到图", async () => {
    const result = await rewriteDirectiveText(
      COMPLETED,
      lookupReturning({ call_a: { status: "completed", result: JSON.stringify(imageResult) } }),
      []
    );

    expect(result!.images).toHaveLength(1);
  });

  it("只有取消项时不动", async () => {
    const cancelledOnly =
      " IMPORTANT: The following tool-call IDs were cancelled by the user before completion: call_c (x). " +
      "These tasks do not have results. Do not treat them as completed and do not call the same tool again unless the user explicitly requests it. ";

    expect(await rewriteText(cancelledOnly, lookupReturning({}), [])).toBeNull();
  });

  describe("挂起的后台调用", () => {
    it("「叫用户去恢复」的原话换掉：说明是在等前端、会自动恢复，不要接手", async () => {
      const text = await rewriteText(SUSPENDED, lookupReturning({}), []);

      expect(text).not.toContain("explicit resume input");
      expect(text).toContain("〔后台调用等待前端〕");
      expect(text).toContain("- agent-swExecutorAgent（call_00）");
      expect(text).toContain("会自动接着跑");
      expect(text).toContain("不要重新派发");
    });

    it("和完成项同在一条提示里时，完成的照常补结果，挂起的换成说明", async () => {
      const text = await rewriteText(
        COMPLETED + SUSPENDED,
        lookupReturning({ call_a: { status: "completed", result: imageResult } }),
        []
      );

      expect(text).toContain("The following tool-call IDs completed successfully: call_a");
      expect(text).toContain("createImageTool（call_a） 已完成");
      expect(text).toContain("〔后台调用等待前端〕");
      expect(text).not.toContain("explicit resume input");
    });

    it("已经改写过的不再改", async () => {
      const once = await rewriteText(SUSPENDED, lookupReturning({}), []);

      expect(await rewriteText(once!, lookupReturning({}), [])).toBeNull();
    });
  });

  describe("委派调用标上任务号（续接提示只给 toolCallId，模型会对错）", () => {
    const history = [delegation("call_00", "1"), delegation("call_03", "4")];

    it("挂起的标上它委派的任务", async () => {
      const text = await rewriteText(SUSPENDED, lookupReturning({}), history);

      expect(text).toContain("agent-swExecutorAgent（call_00，任务 1）");
    });

    it("完成的也标上", async () => {
      const completed =
        " IMPORTANT: The following tool-call IDs completed successfully: call_03 (agent-swExecutorAgent). " +
        "Their results are now in the conversation. Do not call the same tool again — the result is already available. ";

      const text = await rewriteText(
        completed,
        lookupReturning({ call_03: { status: "completed", result: { text: "done" } } }),
        history
      );

      expect(text).toContain("agent-swExecutorAgent（call_03，任务 4） 已完成");
    });

    it("一次委派多个任务时都列出来", () => {
      expect(delegatedTaskIds([delegation("call_x", "2", "3")], "call_x")).toEqual(["2", "3"]);
    });

    it("不是委派调用（入参里没有任务号）就不标", () => {
      expect(delegatedTaskIds([invocation("call_a", imageResult)], "call_a")).toEqual([]);
    });
  });
});

describe("InlineBackgroundTaskResults（真实 MessageList）", () => {
  const processor = new InlineBackgroundTaskResults(
    lookupReturning({ call_a: { status: "completed", result: imageResult } })
  );

  it("把结果写进续接指令，模型下一次调用看到的就是带 url 的提示", async () => {
    const list = listWith([invocation("call_a", "Background task started. Task ID: x.")], COMPLETED);

    await run(processor, list);

    expect(directiveText(list)).toContain(imageResult.url);
  });

  it("图片作为 file part 附在续接指令上，连跑几步也只附一次", async () => {
    const list = listWith([], COMPLETED);

    await run(processor, list);
    await run(processor, list);

    const directive = list.get.all.db().find((m) => m.role === "user")!;
    const files = directive.content.parts.filter((part) => part.type === "file");
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ data: imageResult.url, mimeType: "image/png" });
  });

  it("改写后仍然是 context 来源：只给模型看，不会被当成用户消息落库", async () => {
    const list = listWith([], COMPLETED);

    await run(processor, list);

    expect(list.get.input.db()).toEqual([]);
    expect(list.get.all.db().some((m) => m.role === "user")).toBe(true);
  });

  it("历史消息原样不动", async () => {
    const history = invocation("call_a", imageResult);
    const list = listWith([history], COMPLETED);

    await run(processor, list);

    const kept = list.get.all.db().find((m) => m.role === "assistant")!;
    expect(kept.content.parts).toEqual(history.content.parts);
  });

  it("连跑几步结果只补一次", async () => {
    const list = listWith([], COMPLETED);

    await run(processor, list);
    await run(processor, list);

    expect(directiveText(list).match(/〔后台任务结果〕/g)).toHaveLength(1);
  });

  it("普通用户消息不碰，也不查任务表", async () => {
    const lookup = vi.fn();
    const list = new MessageList({ threadId: "t1", resourceId: "5" });
    list.add([{ role: "user", content: "把标题改大一点" }], "input");

    await run(new InlineBackgroundTaskResults(lookup), list);

    expect(lookup).not.toHaveBeenCalled();
    expect(directiveText(list)).toBe("把标题改大一点");
  });
});

describe("lookupBackgroundTaskInStorage", () => {
  it("按 toolCallId 查后台任务表，取最新一条的状态 / 结果 / 错误", async () => {
    storageMocks.listTasks.mockResolvedValue({
      tasks: [{ status: "completed", result: { url: "u" }, error: undefined }],
      total: 1
    });
    storageMocks.getStore.mockResolvedValue({ listTasks: storageMocks.listTasks });

    const outcome = await lookupBackgroundTaskInStorage("call_a");

    expect(storageMocks.getStore).toHaveBeenCalledWith("backgroundTasks");
    expect(storageMocks.listTasks).toHaveBeenCalledWith(expect.objectContaining({ toolCallId: "call_a", perPage: 1 }));
    expect(outcome).toEqual({ status: "completed", result: { url: "u" }, error: undefined });
  });

  it("查不到任务返回 null", async () => {
    storageMocks.listTasks.mockResolvedValue({ tasks: [], total: 0 });
    storageMocks.getStore.mockResolvedValue({ listTasks: storageMocks.listTasks });

    expect(await lookupBackgroundTaskInStorage("nope")).toBeNull();
  });

  it("没有后台任务存储域时返回 null", async () => {
    storageMocks.getStore.mockResolvedValue(undefined);

    expect(await lookupBackgroundTaskInStorage("call_a")).toBeNull();
  });
});

/** 前端执行中、还没回执的挂起调用：状态仍是 call，所在消息的元数据登记了它 */
const suspendedCall = (toolCallId: string, args: unknown = { components: [{ componentName: "文本框" }] }) =>
  ({
    id: `m-${toolCallId}`,
    role: "assistant",
    content: {
      format: 2,
      parts: [
        {
          type: "tool-invocation",
          toolInvocation: { toolCallId, toolName: "createComponentTool", state: "call", args }
        }
      ],
      metadata: { suspendedTools: { [toolCallId]: { toolCallId, toolName: "createComponentTool" } } }
    }
  }) as unknown as MastraDBMessage;

describe("pendingSuspendedCalls", () => {
  it("找出挂起且没有结果的调用，带上入参", () => {
    expect(pendingSuspendedCalls([suspendedCall("call_x")])).toEqual([
      { toolCallId: "call_x", toolName: "createComponentTool", args: { components: [{ componentName: "文本框" }] } }
    ]);
  });

  it("已经有结果的不算", () => {
    expect(pendingSuspendedCalls([invocation("call_a", { url: "u" })])).toEqual([]);
  });

  it("状态是 call 但不是挂起的（元数据里没登记）不算", () => {
    const plain = suspendedCall("call_y");
    (plain.content as { metadata?: unknown }).metadata = undefined;

    expect(pendingSuspendedCalls([plain])).toEqual([]);
  });
});

describe("pendingCallsNote", () => {
  it("写明工具、id、入参，并告诉模型不要重复调用", () => {
    const note = pendingCallsNote([{ toolCallId: "call_x", toolName: "createComponentTool", args: { a: 1 } }]);

    expect(note).toContain('createComponentTool（call_x）入参：{"a":1}');
    expect(note).toContain("不要重复发起同样的调用");
  });

  it("入参过长时截断", () => {
    const note = pendingCallsNote([{ toolCallId: "c", toolName: "t", args: { text: "字".repeat(1000) } }]);

    expect(note.length).toBeLessThan(900);
    expect(note).toContain("…");
  });
});

describe("InlineBackgroundTaskResults：挂起调用的说明", () => {
  const processor = new InlineBackgroundTaskResults(async () => null);
  const noteMessages = (list: MessageList) =>
    list.get.all.db().filter((m) => m.role === "user" && JSON.stringify(m.content).includes("〔待回传的工具调用〕"));

  it("历史里有挂起没结果的调用时，补一条说明给模型", async () => {
    const list = listWith([suspendedCall("call_x")], COMPLETED);

    await run(processor, list);

    const notes = noteMessages(list);
    expect(notes).toHaveLength(1);
    expect(JSON.stringify(notes[0].content)).toContain("call_x");
  });

  it("每一步都会跑：重复跑不会叠出多条说明", async () => {
    const list = listWith([suspendedCall("call_x")], COMPLETED);

    await run(processor, list);
    await run(processor, list);

    expect(noteMessages(list)).toHaveLength(1);
  });

  it("调用后来有结果了（恢复过），上一步放的说明被撤掉", async () => {
    const list = listWith([suspendedCall("call_x")], COMPLETED);
    await run(processor, list);

    list.removeByIds(["m-call_x"]);
    list.add([invocation("call_x", { success: true })], "memory");
    await run(processor, list);

    expect(noteMessages(list)).toHaveLength(0);
  });

  it("没有挂起的调用就不加任何东西", async () => {
    const list = listWith([invocation("call_a", imageResult)], COMPLETED);

    await run(processor, list);

    expect(noteMessages(list)).toHaveLength(0);
  });
});

describe("directiveToolCallIds", () => {
  it("完成、失败、取消三类点到名的 id 都取出来", () => {
    const cancelled =
      " IMPORTANT: The following tool-call IDs were cancelled by the user before completion: call_c (createImageTool). " +
      "These tasks do not have results. ";

    expect(directiveToolCallIds(COMPLETED + FAILED + cancelled)).toEqual(["call_a", "call_b", "call_c"]);
  });

  it("不是续接指令就是空的", () => {
    expect(directiveToolCallIds("把标题改大一点")).toEqual([]);
  });
});

const finished = (toolCallId: string, extra: Partial<FinishedBackgroundTask> = {}): FinishedBackgroundTask => ({
  toolCallId,
  toolName: "createImageTool",
  status: "completed",
  result: imageResult,
  ...extra
});

describe("catchUpNote", () => {
  it("写明以这里为准，带上结果和要附的图", () => {
    const note = catchUpNote([finished("call_r")]);

    expect(note.text).toContain("〔后台任务补报〕");
    expect(note.text).toContain("以这里为准");
    expect(note.text).toContain(`createImageTool（call_r） 已完成，结果：`);
    expect(note.text).toContain(imageResult.url);
    expect(note.images).toEqual(imageResult.imagesForModel);
  });

  it("失败、超时、取消各自写明原因", () => {
    const note = catchUpNote([
      finished("call_f", { status: "failed", result: undefined, error: { message: "额度不足" } }),
      finished("call_t", { status: "timed_out", result: undefined }),
      finished("call_c", { status: "cancelled", result: undefined })
    ]);

    expect(note.text).toContain("createImageTool（call_f） 失败：额度不足");
    expect(note.text).toContain("createImageTool（call_t） 失败：超时");
    expect(note.text).toContain("createImageTool（call_c） 已被用户取消");
    expect(note.images).toEqual([]);
  });
});

/** 内存版台账：记过账的下次就不再列出来，和真实台账的行为一致 */
const memoryLedger = (tasks: FinishedBackgroundTask[]) => {
  const notified = new Set<string>();
  const ledger = {
    listUnnotified: vi.fn(async () => tasks.filter((task) => !notified.has(task.toolCallId))),
    markNotified: vi.fn(async (_threadId: string, toolCallIds: string[]) => {
      toolCallIds.forEach((toolCallId) => notified.add(toolCallId));
    })
  } satisfies BackgroundTaskNoticeLedger;
  return { ledger, notified };
};

/** 一次普通的用户提问（不是续接轮），thread 为 t1 */
const askedList = () => {
  const list = new MessageList({ threadId: "t1", resourceId: "5" });
  list.add([{ role: "user", content: "已经生成完了啊" }], "input");
  return list;
};

const catchUpMessages = (list: MessageList) =>
  list.get.all.db().filter((m) => m.role === "user" && JSON.stringify(m.content).includes("〔后台任务补报〕"));

describe("InlineBackgroundTaskResults：拿任务表对账补报", () => {
  it("结束了却没通知到的任务，补一条带结果的说明，图片作为 file part 附上，并记账", async () => {
    const { ledger, notified } = memoryLedger([finished("call_r")]);
    const list = askedList();

    await run(new InlineBackgroundTaskResults(async () => null, ledger), list);

    const notes = catchUpMessages(list);
    expect(ledger.listUnnotified).toHaveBeenCalledWith("t1");
    expect(notes).toHaveLength(1);
    expect(JSON.stringify(notes[0].content)).toContain(imageResult.url);
    expect(notes[0].content.parts.filter((part) => part.type === "file")).toHaveLength(1);
    expect([...notified]).toEqual(["call_r"]);
  });

  it("补报是 context 来源：只给模型看，不落库", async () => {
    const { ledger } = memoryLedger([finished("call_r")]);
    const list = askedList();

    await run(new InlineBackgroundTaskResults(async () => null, ledger), list);

    expect(list.get.input.db().map((m) => directiveTextOf(m))).toEqual(["已经生成完了啊"]);
  });

  it("每一步都会跑：补报过一次就不再叠", async () => {
    const { ledger } = memoryLedger([finished("call_r")]);
    const processor = new InlineBackgroundTaskResults(async () => null, ledger);
    const list = askedList();

    await run(processor, list);
    await run(processor, list);

    expect(catchUpMessages(list)).toHaveLength(1);
  });

  it("本步续接指令里已经点名的任务照常改写，不重复补报，但要记账", async () => {
    const { ledger, notified } = memoryLedger([finished("call_a")]);
    const list = listWith([], COMPLETED);

    await run(
      new InlineBackgroundTaskResults(
        lookupReturning({ call_a: { status: "completed", result: imageResult } }),
        ledger
      ),
      list
    );

    expect(directiveText(list)).toContain(imageResult.url);
    expect(catchUpMessages(list)).toHaveLength(0);
    expect([...notified]).toEqual(["call_a"]);
  });

  it("没有要补报的就什么都不加", async () => {
    const { ledger } = memoryLedger([]);
    const list = askedList();

    await run(new InlineBackgroundTaskResults(async () => null, ledger), list);

    expect(catchUpMessages(list)).toHaveLength(0);
    expect(list.get.all.db()).toHaveLength(1);
  });

  it("对账出错（库连不上）只记日志，不拖垮这一轮", async () => {
    const ledger: BackgroundTaskNoticeLedger = {
      listUnnotified: vi.fn().mockRejectedValue(new Error("db down")),
      markNotified: vi.fn()
    };
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const list = askedList();

    await expect(run(new InlineBackgroundTaskResults(async () => null, ledger), list)).resolves.toBe(list);

    expect(catchUpMessages(list)).toHaveLength(0);
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });

  it("拿不到 threadId（没挂 memory 的调用）就不对账", async () => {
    const { ledger } = memoryLedger([finished("call_r")]);
    const list = new MessageList();
    list.add([{ role: "user", content: "hi" }], "input");

    await run(new InlineBackgroundTaskResults(async () => null, ledger), list);

    expect(ledger.listUnnotified).not.toHaveBeenCalled();
  });
});

function directiveTextOf(message: MastraDBMessage): string {
  return message.content.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}
