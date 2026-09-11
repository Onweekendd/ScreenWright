# 通过自定义接口使用 clientTool 实现指南

本指南说明如何**不依赖** `@mastra/client-js` 的 `agent.stream()`，改由自己的后端 API 调用 Mastra Agent，并在前端手动处理 clientTool 执行与结果回传的完整流程。

---

## 方案架构

```
前端                          你的后端 API                    Mastra Agent
  |                               |                               |
  | POST /api/chat                |                               |
  | { messages, clientTools }     |                               |
  |------------------------------>|                               |
  |                               | agent.stream(messages,        |
  |                               |   { clientTools: schemas })   |
  |                               |------------------------------>|
  |                               |                               |
  |<-- SSE 流 (直接 pipe) --------|<-- Mastra SSE 流 -------------|
  |                               |                               |
  | [解析流，检测 tool-call]       |                               |
  | [本地执行 clientTool]         |                               |
  |                               |                               |
  | POST /api/chat                |                               |
  | { messages + tool results }   |                               |  ← 关键：带着结果重新请求
  |------------------------------>|                               |
  |                               | agent.stream(新 messages)     |
  |                               |------------------------------>|
  |<-- SSE 流（最终回复）---------|<-- Mastra SSE 流 -------------|
```

**核心机制**：工具结果不是"回写"给已有的连接，而是追加到消息历史后**重新发起一次新的请求**。

---

## 第一步：后端 API 实现

后端接收前端传来的 `messages` 和 `clientTools`（只有 schema，没有 execute），调用 Mastra agent，将 SSE 流直接 pipe 给前端。

```typescript
// app/api/chat/route.ts (Next.js App Router)
import { mastra } from '@/mastra';

export async function POST(req: Request) {
  const { messages, clientTools } = await req.json();

  const agent = mastra.getAgent('your-agent-id');

  // clientTools 只包含 schema，没有 execute 函数
  // Mastra 会把它们注册进 LLM tool list，但服务端不会执行
  const result = await agent.stream(messages, {
    clientTools,        // { toolName: { description, inputSchema } }
    threadId: '...',    // 可选：记忆线程
    resourceId: '...',  // 可选
  });

  // 直接把 Mastra 的 SSE 流 pipe 给前端
  return new Response(result.fullStream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

> **注意**：`clientTools` 中不能包含 `execute` 函数（函数无法 JSON 序列化）。前端发送时只传 schema 部分，`execute` 函数保留在前端本地。

---

## 第二步：前端定义 clientTools

前端维护一份完整的 clientTools 定义（含 `execute`），发请求时只发 schema 部分：

```typescript
// 完整定义（含 execute，只在前端使用）
const clientTools = {
  changeColor: {
    description: 'Changes the background color of the page',
    inputSchema: {
      type: 'object',
      properties: {
        color: { type: 'string', description: 'CSS color value' },
      },
      required: ['color'],
    },
    execute: async ({ color }: { color: string }) => {
      document.body.style.backgroundColor = color;
      return { success: true, appliedColor: color };
    },
  },
  showNotification: {
    description: 'Shows a notification to the user',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        type: { type: 'string', enum: ['info', 'success', 'error'] },
      },
      required: ['message'],
    },
    execute: async ({ message, type }: { message: string; type: string }) => {
      alert(`[${type}] ${message}`);
      return { shown: true };
    },
  },
};

// 发给后端时，剥掉 execute（只保留 schema）
function stripExecute(tools: typeof clientTools) {
  return Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => {
      const { execute, ...schema } = tool;
      return [name, schema];
    })
  );
}
```

---

## 第三步：前端解析 Mastra SSE 流

Mastra 的 SSE 流格式是：
```
data: {"type":"text-delta","payload":{"text":"你好"}}\n\n
data: {"type":"tool-call","payload":{"toolCallId":"call_abc","toolName":"changeColor","args":{"color":"blue"}}}\n\n
data: {"type":"finish","payload":{"stepResult":{"reason":"tool-calls"},"output":{"messages":[...]}}}\n\n
data: [DONE]\n\n
```

解析函数：

```typescript
interface MastraChunk {
  type: string;
  payload: any;
}

async function parseMastraStream(
  response: Response,
  onText: (text: string) => void,
  onChunk?: (chunk: MastraChunk) => void,
): Promise<{
  finishReason: string;
  toolCalls: Array<{ toolCallId: string; toolName: string; args: any }>;
  responseMessages: any[];  // agent 本次回复生成的消息（含 assistant 消息和 tool-call 记录）
}> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const toolCalls: Array<{ toolCallId: string; toolName: string; args: any }> = [];
  let finishReason = 'stop';
  let responseMessages: any[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      if (!part.startsWith('data: ')) continue;
      const data = part.slice(6).trim();
      if (data === '[DONE]') return { finishReason, toolCalls, responseMessages };

      let chunk: MastraChunk;
      try {
        chunk = JSON.parse(data);
      } catch {
        continue;
      }

      onChunk?.(chunk);

      switch (chunk.type) {
        case 'text-delta':
          onText(chunk.payload.text);
          break;

        case 'tool-call':
          // 收集完整的 tool call（args 已经完整）
          toolCalls.push({
            toolCallId: chunk.payload.toolCallId,
            toolName: chunk.payload.toolName,
            args: chunk.payload.args,
          });
          break;

        case 'finish':
          finishReason = chunk.payload.stepResult?.reason ?? 'stop';
          // finish payload 中包含本次 agent 生成的完整消息列表
          responseMessages = chunk.payload.output?.messages ?? [];
          break;

        case 'error':
          throw new Error(String(chunk.payload.error));
      }
    }
  }

  return { finishReason, toolCalls, responseMessages };
}
```

---

## 第四步：执行 clientTool 并把结果带回接口（核心）

当 `finishReason === 'tool-calls'` 时，说明 Agent 调用了工具但无法在服务端执行（因为是 clientTool）。

此时需要：
1. 在前端本地执行对应的 `execute()` 函数
2. 把执行结果构造成 `role: 'tool'` 格式的消息
3. 将这些消息**追加到消息历史**后，重新发起请求

```typescript
// 构造工具结果消息的格式（符合 CoreMessage 规范）
function buildToolResultMessages(
  toolCalls: Array<{ toolCallId: string; toolName: string; args: any }>,
  toolResults: Array<{ toolCallId: string; result: any }>,
) {
  return [
    {
      role: 'tool' as const,
      content: toolResults.map(({ toolCallId, result }) => {
        const call = toolCalls.find(c => c.toolCallId === toolCallId)!;
        return {
          type: 'tool-result' as const,
          toolCallId,
          toolName: call.toolName,
          result,  // execute() 的返回值
        };
      }),
    },
  ];
}
```

---

## 第五步：完整的对话循环

把以上所有步骤组合成一个完整的、支持多轮 clientTool 调用的对话函数：

```typescript
async function chat(
  userMessage: string,
  clientTools: Record<string, any>,
  options: {
    onText: (text: string) => void;
    threadId?: string;
  },
  // 内部递归时传入，用户调用时不需要传
  _existingMessages?: any[],
) {
  const messages = _existingMessages ?? [
    { role: 'user', content: userMessage },
  ];

  // 1. 调用后端接口，只发 schema（不含 execute）
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      clientTools: stripExecute(clientTools),
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  // 2. 解析流
  const { finishReason, toolCalls, responseMessages } = await parseMastraStream(
    response,
    options.onText,
  );

  // 3. 如果 Agent 调用了工具，在前端执行并重新请求
  if (finishReason === 'tool-calls' && toolCalls.length > 0) {
    // 找出哪些是 clientTool（通过名字匹配）
    const clientToolCalls = toolCalls.filter(tc => tc.toolName in clientTools);

    if (clientToolCalls.length === 0) {
      // 没有 clientTool，说明是服务端工具调用但出错了
      console.warn('finishReason is tool-calls but no matching clientTools found');
      return;
    }

    // 执行所有 clientTool
    const toolResults = await Promise.all(
      clientToolCalls.map(async (toolCall) => {
        const tool = clientTools[toolCall.toolName];
        let result: any = null;
        try {
          result = await tool.execute(toolCall.args);
        } catch (error) {
          result = { error: String(error) };
        }
        return {
          toolCallId: toolCall.toolCallId,
          result,
        };
      })
    );

    // 构造携带工具结果的新消息历史：
    //   原有消息 + agent 本次生成的消息（含 assistant 的 tool-call 记录）+ tool result 消息
    //
    // responseMessages 来自 finish chunk 的 payload.output.messages，
    // 它包含了 agent 这一轮生成的 assistant 消息（含 tool-call 标记），
    // 必须带上，否则后端收到孤立的 tool result 会报错
    const updatedMessages = [
      ...messages,
      ...responseMessages,           // agent 这轮生成的消息（含 tool-call 记录）
      ...buildToolResultMessages(clientToolCalls, toolResults),  // tool result
    ];

    // 递归：带着工具结果重新请求，直到 finishReason === 'stop'
    return chat(userMessage, clientTools, options, updatedMessages);
  }

  // finishReason === 'stop'，对话结束
}
```

### 调用示例

```typescript
let displayText = '';

await chat(
  '把背景色改成蓝色，然后告诉我改好了',
  clientTools,
  {
    onText: (text) => {
      displayText += text;
      console.log('streaming:', text);
    },
    threadId: 'user-123-thread-1',
  }
);

console.log('final:', displayText);
```

---

## 第六步（可选）：后端转换为 AI SDK Data Stream 格式，前端手动解析

如果你希望后端统一输出 AI SDK 的 Data Stream Protocol 格式（以数字前缀区分的行协议），前端自己解析而不依赖 `useChat`，可以按以下方式实现。

**AI SDK Data Stream 格式**比 Mastra 原始 SSE 格式更好解析——每行一个前缀字符，直接 split 即可，不需要处理 `data:` 前缀和换行符分隔。

### 后端：Mastra SSE → AI SDK Data Stream

```typescript
// app/api/chat/route.ts
import { mastra } from '@/mastra';

// Mastra chunk → AI SDK Data Stream 行协议
// 格式：{prefix}:{JSON}\n
// 前缀含义：0=文本, 9=tool-call, a=tool-result, b=tool-call-start, c=tool-call-delta, d=finish, 3=error
function mastraChunkToAISDKLine(chunk: any): string | null {
  switch (chunk.type) {
    case 'text-delta':
      return `0:${JSON.stringify(chunk.payload.text)}\n`;

    case 'tool-call-input-streaming-start':
      return `b:${JSON.stringify({
        toolCallId: chunk.payload.toolCallId,
        toolName: chunk.payload.toolName,
      })}\n`;

    case 'tool-call-delta':
      return `c:${JSON.stringify({
        toolCallId: chunk.payload.toolCallId,
        argsTextDelta: chunk.payload.argsTextDelta,
      })}\n`;

    case 'tool-call':
      return `9:${JSON.stringify({
        toolCallId: chunk.payload.toolCallId,
        toolName: chunk.payload.toolName,
        args: chunk.payload.args,
      })}\n`;

    case 'tool-result':
      return `a:${JSON.stringify({
        toolCallId: chunk.payload.toolCallId,
        result: chunk.payload.result,
      })}\n`;

    case 'finish': {
      const reason = chunk.payload.stepResult?.reason ?? 'stop';
      const usage = chunk.payload.output?.usage ?? {};
      // finish chunk 还需要携带 responseMessages，供前端构造重新请求的 messages
      return `d:${JSON.stringify({
        finishReason: reason,
        usage: {
          promptTokens: usage.inputTokens ?? 0,
          completionTokens: usage.outputTokens ?? 0,
        },
        // 把 agent 本轮生成的消息一并带出，前端重新请求时需要
        responseMessages: chunk.payload.output?.messages ?? [],
      })}\n`;
    }

    case 'error':
      return `3:${JSON.stringify(String(chunk.payload.error))}\n`;

    default:
      return null;
  }
}

export async function POST(req: Request) {
  const { messages, clientTools } = await req.json();
  const agent = mastra.getAgent('your-agent-id');

  const result = await agent.stream(messages, { clientTools });

  // TransformStream：Mastra SSE → AI SDK Data Stream 行协议
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      const parts = text.split('\n\n');
      for (const part of parts) {
        if (!part.startsWith('data: ')) continue;
        const data = part.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const mastraChunk = JSON.parse(data);
          const line = mastraChunkToAISDKLine(mastraChunk);
          if (line) controller.enqueue(new TextEncoder().encode(line));
        } catch {}
      }
    },
  });

  return new Response(
    (result.fullStream as unknown as ReadableStream).pipeThrough(transform),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    }
  );
}
```

### 前端：手动解析 AI SDK Data Stream

```typescript
interface ParsedAISDKStream {
  finishReason: string;
  toolCalls: Array<{ toolCallId: string; toolName: string; args: any }>;
  responseMessages: any[];
}

async function parseAISDKStream(
  response: Response,
  onText: (text: string) => void,
): Promise<ParsedAISDKStream> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const toolCalls: Array<{ toolCallId: string; toolName: string; args: any }> = [];
  let finishReason = 'stop';
  let responseMessages: any[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';  // 最后一行可能不完整，留到下次

    for (const line of lines) {
      if (!line.trim()) continue;

      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const prefix = line.slice(0, colonIdx);
      const data = line.slice(colonIdx + 1);

      try {
        switch (prefix) {
          case '0': // 文本增量
            onText(JSON.parse(data));
            break;

          case '9': { // 完整 tool call
            const toolCall = JSON.parse(data);
            toolCalls.push(toolCall);
            break;
          }

          case 'd': { // finish
            const finish = JSON.parse(data);
            finishReason = finish.finishReason;
            responseMessages = finish.responseMessages ?? [];
            break;
          }

          case '3': // error
            throw new Error(JSON.parse(data));
        }
      } catch (e) {
        if (e instanceof Error && prefix !== '3') {
          console.warn('Failed to parse line:', line, e);
        } else {
          throw e;
        }
      }
    }
  }

  return { finishReason, toolCalls, responseMessages };
}
```

### 前端：完整对话循环（使用 AI SDK 格式）

```typescript
async function runChatLoop(
  messages: any[],
  clientTools: Record<string, any>,
  onText: (text: string) => void,
): Promise<string> {
  let fullText = '';

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      clientTools: stripExecute(clientTools),
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const { finishReason, toolCalls, responseMessages } = await parseAISDKStream(
    response,
    (text) => {
      fullText += text;
      onText(text);
    },
  );

  if (finishReason === 'tool-calls' && toolCalls.length > 0) {
    const clientToolCalls = toolCalls.filter(tc => tc.toolName in clientTools);

    // 执行所有 clientTool
    const toolResults = await Promise.all(
      clientToolCalls.map(async (tc) => ({
        toolCallId: tc.toolCallId,
        result: await clientTools[tc.toolName]
          .execute(tc.args)
          .catch((e: Error) => ({ error: e.message })),
      }))
    );

    // 带工具结果递归重新请求
    const continueText = await runChatLoop(
      [
        ...messages,
        ...responseMessages,                              // agent 本轮生成的消息（含 tool-call 记录）
        ...buildToolResultMessages(clientToolCalls, toolResults),  // tool result
      ],
      clientTools,
      onText,
    );

    return fullText + continueText;
  }

  return fullText;
}
```

### AI SDK Data Stream 前缀速查

| 前缀 | 含义 | 对应 Mastra chunk type |
|------|------|----------------------|
| `0` | 文本增量 | `text-delta` |
| `3` | 错误 | `error` |
| `9` | 完整 tool call | `tool-call` |
| `a` | tool result | `tool-result` |
| `b` | tool call 流式开始 | `tool-call-input-streaming-start` |
| `c` | tool call 参数增量 | `tool-call-delta` |
| `d` | finish（含 finishReason、usage、responseMessages） | `finish` |

---

## 消息格式参考

### 后端发送给 agent.stream() 的 clientTools 格式

```typescript
{
  clientTools: {
    changeColor: {
      description: 'Changes the background color',
      inputSchema: {
        type: 'object',
        properties: {
          color: { type: 'string' }
        },
        required: ['color']
      }
      // 没有 execute！
    }
  }
}
```

### 工具结果消息格式（回传给 agent 时追加到 messages）

```typescript
// 这条消息追加在 responseMessages 之后
{
  role: 'tool',
  content: [
    {
      type: 'tool-result',
      toolCallId: 'call_abc123',   // 必须和 tool-call chunk 中的 id 对应
      toolName: 'changeColor',     // 工具名称
      result: {                    // execute() 的返回值，任意 JSON
        success: true,
        appliedColor: 'blue'
      }
    }
  ]
}
```

### 重新请求时完整的 messages 结构

```
[
  { role: 'user', content: '把背景色改成蓝色' },         ← 原始用户消息

  // responseMessages（来自 finish chunk 的 payload.output.messages）
  { role: 'assistant', content: [                        ← agent 这轮生成的消息
    { type: 'tool-call', toolCallId: 'call_abc', toolName: 'changeColor', args: { color: 'blue' } }
  ]},

  // 工具结果（前端执行后追加）
  { role: 'tool', content: [                             ← 工具执行结果
    { type: 'tool-result', toolCallId: 'call_abc', toolName: 'changeColor', result: { success: true } }
  ]},
]
```

> **重要**：`responseMessages` 中的 assistant 消息必须带上，不能只发 tool result，否则 LLM 无法匹配 tool call 和 tool result 的对应关系，会报错。

---

## 常见问题

### Q：为什么 finishReason 是 'tool-calls' 而不是 'stop'？

Agent 检测到调用了没有 `execute` 函数的工具（clientTool），就知道需要等客户端执行，所以停止并报告 `tool-calls`。这是 Mastra 的设计：服务端 tool 有 execute 会继续执行；客户端 tool 没有 execute 会停止并等待客户端回传结果。

### Q：如果 Agent 同时调用了一个服务端 tool 和一个 clientTool 怎么办？

服务端 tool 会在服务端自动执行，其结果已经包含在 `responseMessages` 里了。前端只需要执行 clientTool 并回传结果。通过 `toolName in clientTools` 来区分哪些是 clientTool 即可。

### Q：clientTool 的 execute() 可以返回 null/undefined 吗？

可以。如果没有有意义的返回值，返回 `null` 即可。Mastra agent 会把 null 作为工具结果继续执行。

### Q：如何处理 clientTool 执行失败的情况？

在 `execute()` 外包一层 try/catch，把错误信息作为 result 返回：
```typescript
result: await tool.execute(args).catch(e => ({ error: e.message }))
```
这样 Agent 收到 error result 后会根据上下文决定是否重试或告知用户。
