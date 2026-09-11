import { beforeEach, describe, expect, it } from "vitest";

import { answerOnlyOriginalIntent, applyFailures } from "../../evals/harness/case";
import { createFakeFrontend, resetComponentIdAllocator } from "../../evals/harness/fake-frontend";

// 假前端是 eval 里唯一「替真实前端说话」的地方，它答错的代价很隐蔽：工具照常挂起、照常收到
// 应答，工作区却没变——看起来像 agent 没干活。这里钉住的两条都是真跑时踩出来的。

const meta = { toolName: "t", toolCallId: "c", channel: "main" as const };

beforeEach(() => {
  resetComponentIdAllocator();
});

describe("批次标识回传", () => {
  // edit_files 一次可以改多个文件，靠 batchId:operationId 认领每一帧 resume 属于哪一项。
  // 不回传的话它报 `edit_files resume mismatch: expected <batchId>:0, received undefined`，
  // 这次编辑一个字节都不会落盘——实测把 a4「改个宽度」整轮拖垮。
  it("原样带回 suspend 载荷里的 batchId / operationId", () => {
    const fe = createFakeFrontend();

    const resume = fe.reply(
      { type: "push_component_update", batchId: "batch-1", operationId: "0", component: {} },
      meta
    );

    expect(resume).toMatchObject({ componentUpdated: true, batchId: "batch-1", operationId: "0" });
  });

  it("载荷里没有批次标识时不凭空造", () => {
    const fe = createFakeFrontend();

    const resume = fe.reply({ type: "push_component_update", component: {} }, meta);

    expect(resume).not.toHaveProperty("batchId");
    expect(resume).not.toHaveProperty("operationId");
  });

  it("拒绝路径也要带批次标识——否则工具同样认领不了这一帧", () => {
    const fe = createFakeFrontend({ approve: false });

    const resume = fe.reply({ type: "create_component", batchId: "b", operationId: "2", component: {} }, meta);

    expect(resume).toMatchObject({ approved: false, batchId: "b", operationId: "2" });
  });
});

describe("复制组件时整棵子树都换新 id", () => {
  // 只换顶层的话，core 的 upsert 会按「先摘再放」把原件的子组件搬到副本下面：
  // 原分组 children 变空，副本挂着原来那对 id——树上看着两个分组，其实只有一份组件。
  const group = {
    id: 4177,
    name: "分组",
    children: [
      { id: 4175, name: "条形图", parent: 4177 },
      { id: 4176, name: "折线柱形图", parent: 4177 }
    ]
  };

  it("父子都拿到新 id，且子组件的 parent 指向新父", () => {
    const fe = createFakeFrontend();

    const resume = fe.reply({ type: "copy_component", component: group }, meta);
    const copy = resume.component as { id: number; children: Array<{ id: number; parent: number }> };

    expect(copy.id).not.toBe(4177);
    expect(copy.children.map((c) => c.id)).not.toContain(4175);
    expect(copy.children.map((c) => c.id)).not.toContain(4176);
    expect(new Set(copy.children.map((c) => c.parent))).toEqual(new Set([copy.id]));
  });

  it("原载荷不被就地改动——工具后面还要用它算 placement", () => {
    const fe = createFakeFrontend();

    fe.reply({ type: "copy_component", component: group }, meta);

    expect(group.id).toBe(4177);
    expect(group.children[0]!.id).toBe(4175);
  });

  it("动态面板各状态 config 里的子组件同样换新 id", () => {
    const fe = createFakeFrontend();

    const resume = fe.reply(
      {
        type: "copy_component",
        component: { id: 4178, name: "动态面板", panelData: [{ id: "s1", config: [{ id: 4190, name: "文本" }] }] }
      },
      meta
    );
    const copy = resume.component as { panelData: Array<{ config: Array<{ id: number }> }> };

    expect(copy.panelData[0]!.config[0]!.id).not.toBe(4190);
  });

  it("磁盘形态的字符串 children 原样放过（那是文件引用，不是这条路的形态）", () => {
    const fe = createFakeFrontend();

    const resume = fe.reply({ type: "copy_component", component: { id: 1, children: ["4175_条形图"] } }, meta);

    expect((resume.component as { children: unknown[] }).children).toEqual(["4175_条形图"]);
  });
});

describe("浏览器执行", () => {
  it("回失败而不是 ok:true——eval 里没有 DOM，谎称成功会让 agent 基于假结果继续推进", () => {
    const fe = createFakeFrontend();

    const resume = fe.reply({ type: "execute_in_browser", script: "1+1" }, meta);

    expect(resume).toMatchObject({ ok: false });
    expect(String(resume.error)).toContain("没有浏览器");
  });
});

describe("ask_user_question 的应答策略", () => {
  const ask = (questions: Array<{ question: string; options: string[] }>) => ({
    type: "ask_user_question",
    questions: questions.map((q) => ({ question: q.question, options: q.options.map((label) => ({ label })) }))
  });

  it("默认取第一个选项", () => {
    const fe = createFakeFrontend();

    const resume = fe.reply(ask([{ question: "改成什么", options: ["800", "保持现状"] }]), meta);

    expect(resume).toEqual({ answers: { 改成什么: "800" } });
  });

  // 判据是提问内容不是提问序号。C3 为此栽过两次，两次都是应答策略的锅而不是产品的：
  //   2026-09-02 默认取第一个选项，把 800 写了进去
  //   2026-09-07 改用「第一问放行」后，agent 只问了一次且那一问已是替代方案，序号错位一格
  const onlyIntent = () => createFakeFrontend({ answer: answerOnlyOriginalIntent(/很宽|字符串/u) });

  it("提问里出现原话诉求时点头", () => {
    const resume = onlyIntent().reply(
      ask([{ question: "width 必须是数字，确认要写字符串吗", options: ["确认写入", "取消"] }]),
      meta
    );

    expect(resume).toEqual({ answers: { "width 必须是数字，确认要写字符串吗": "确认写入" } });
  });

  it("选项里出现原话诉求时也点头——提问本身没提也算", () => {
    const resume = onlyIntent().reply(ask([{ question: "怎么处理", options: ["仍然写成 很宽", "取消"] }]), meta);

    expect(resume).toEqual({ answers: { 怎么处理: "仍然写成 很宽" } });
  });

  it("回归：第一问就是替代方案时照样回绝", () => {
    // 2026-09-07 实测的原样问法。上一版按 askIndex===0 判为「原始诉求」，
    // 于是选了 1200px，agent 尽责写进去，「工作区一个字节没动」变红
    const resume = onlyIntent().reply(
      ask([
        {
          question: "「条形图」的宽度想要改成多少（当前为 600px）？",
          options: ["改成 1200px", "改成 800px", "维持 600px 不变", "我自己给数值"]
        }
      ]),
      meta
    );

    expect(resume).toEqual({ answers: { "「条形图」的宽度想要改成多少（当前为 600px）？": "维持 600px 不变" } });
  });

  it("回归：提问复述了原话、但选项全是替代方案时仍然回绝", () => {
    // 2026-09-07 第二次实测。agent 在提问里复述「很宽」是为了说明它做不到，
    // 四个选项没有一个是照原话做的。上一版只看提问就判定「这是确认原始诉求」，
    // 找不到肯定选项又退回 options[0]，于是选中「拉宽到 1920 铺满」写了进去
    const resume = onlyIntent().reply(
      ask([
        {
          question: "component.width 是数值像素（当前 600），改成字符串「很宽」会被 schema 拒绝。你实际想要哪种？",
          options: ["拉宽到 1920 铺满", "拉宽到指定像素", "保持 600 不变", "我指错了对象"]
        }
      ]),
      meta
    );

    expect(resume).toEqual({
      answers: {
        "component.width 是数值像素（当前 600），改成字符串「很宽」会被 schema 拒绝。你实际想要哪种？": "保持 600 不变"
      }
    });
  });

  it("回绝选项按词面找，不指望它排在末尾", () => {
    const resume = onlyIntent().reply(ask([{ question: "第二问", options: ["维持原样", "改成 800"] }]), meta);

    expect(resume).toEqual({ answers: { 第二问: "维持原样" } });
  });

  it("一句能回绝的都没有时退回最后一个选项", () => {
    const resume = onlyIntent().reply(ask([{ question: "第二问", options: ["改成 800", "改成 900"] }]), meta);

    expect(resume).toEqual({ answers: { 第二问: "改成 900" } });
  });

  it("同一次挂起里的多个问题各自独立判断", () => {
    const resume = onlyIntent().reply(
      ask([
        { question: "确认写成 很宽 吗", options: ["确认", "取消"] },
        { question: "那要不要顺便改个颜色", options: ["改成蓝色", "保持不变"] }
      ]),
      meta
    );

    expect(resume).toEqual({ answers: { "确认写成 很宽 吗": "确认", 那要不要顺便改个颜色: "保持不变" } });
  });

  it("策略无状态：同一个问句问几次答案都一样", () => {
    // 上一版靠实例内的 askIndex 计数，同样的问句在第 1 次和第 2 次会得到相反的答案；
    // 现在只看内容，问几次都一样，也就不存在「轮次跨没跨实例」这类隐患
    const fe = onlyIntent();
    const q = ask([{ question: "改成多少", options: ["改成 800", "保持现状"] }]);

    expect(fe.reply(q, meta)).toEqual(fe.reply(q, meta));
    expect(fe.reply(q, meta)).toEqual({ answers: { 改成多少: "保持现状" } });
  });
});

describe("前端应用失败的原因", () => {
  const createSuspend = () => ({ type: "create_component", component: { id: 1, component: { prop: "swtext" } } });

  it("不给 applyFailure 就是应用成功 —— 缺省本身是语义，不该被补成某种默认失败", () => {
    const resume = createFakeFrontend({}).reply(createSuspend(), meta) as { approved?: boolean; error?: string };

    expect(resume.approved).toBe(true);
    expect(resume.error).toBeUndefined();
  });

  it("channelDown 要点明重试和换工具都没用 —— 否则 agent 只能靠猜，会去委派子 agent", () => {
    const frontend = createFakeFrontend({ applyFailure: applyFailures.channelDown });

    const resume = frontend.reply(createSuspend(), meta) as { approved?: boolean; error?: string };

    expect(resume.approved).toBe(true);
    expect(resume.error).toContain("添加组件");
    expect(resume.error).toContain("重试");
    expect(resume.error).toContain("换工具");
  });

  it("payloadRejected 要带上具体字段 —— 这类失败是改得对的，不能说成通道不通", () => {
    const frontend = createFakeFrontend({
      applyFailure: applyFailures.payloadRejected('width 必须为正整数，收到 "很宽"')
    });

    const resume = frontend.reply(createSuspend(), meta) as { error?: string };

    expect(resume.error).toContain("width 必须为正整数");
    expect(resume.error).not.toContain("重试");
  });

  it("同一个 policy 对不同操作要报出对应的操作名", () => {
    const frontend = createFakeFrontend({ applyFailure: applyFailures.channelDown });

    const del = frontend.reply({ type: "delete_component" }, meta) as { error?: string };

    expect(del.error).toContain("删除组件");
  });
});
