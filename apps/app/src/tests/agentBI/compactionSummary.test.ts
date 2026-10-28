import { describe, expect, it } from "vitest";

import { mount } from "@vue/test-utils";

import type { UIMessage } from "ai";

import CompactionSummary from "@/views/build/components/agentBI/components/CompactionSummary.vue";
import {
  compactedMessageIds,
  insertCompactionSummary,
  isCompactionSummary,
  summaryBody
} from "@/views/build/components/agentBI/hooks/message/compactionSummary";
import { groupAssistantMessages } from "@/views/build/components/agentBI/hooks/message/groupAssistantMessages";

/** 后端 buildSummaryText 的形态：标记 + 写给模型的前缀 + 摘要正文 */
const SUMMARY_TEXT =
  "<!-- compaction-summary-v1 -->\n另一个语言模型在解决当前的 BI 数据大屏构建任务时,生成了下面这份接续摘要。\n\n" +
  "<conversation-summary>\n## 1. 当前任务状态\n标题飘带素材在后台生成中\n</conversation-summary>";

/** 摘要现在以 user 身份落库；改之前存下的旧摘要是 assistant */
const summary = (
  id: string,
  metadata: unknown = { kind: "compaction_summary", stats: { hiddenTokenCount: 182000 } },
  role: UIMessage["role"] = "user"
) => ({ id, role, metadata, parts: [{ type: "text", text: SUMMARY_TEXT }] }) as UIMessage;
const user = (id: string): UIMessage => ({ id, role: "user", parts: [{ type: "text", text: "继续" }] });
const assistant = (id: string): UIMessage => ({ id, role: "assistant", parts: [{ type: "text", text: "好的" }] });

describe("isCompactionSummary", () => {
  it("按后端打的 metadata.kind 认出摘要", () => {
    expect(isCompactionSummary(summary("s"))).toBe(true);
  });

  it("没带 metadata 时按正文开头的标记兜底，新旧两种 role 都认", () => {
    expect(isCompactionSummary(summary("s", undefined))).toBe(true);
    expect(isCompactionSummary(summary("s", undefined, "assistant"))).toBe(true);
  });

  it("普通消息不是摘要", () => {
    expect(isCompactionSummary(assistant("a"))).toBe(false);
    expect(isCompactionSummary(user("u"))).toBe(false);
  });
});

describe("summaryBody", () => {
  it("去掉标记和写给模型的前缀，只留摘要正文", () => {
    expect(summaryBody(summary("s"))).toBe("## 1. 当前任务状态\n标题飘带素材在后台生成中");
  });
});

describe("compactedMessageIds", () => {
  it("最新一条摘要之前的消息都算被压缩，摘要本身和之后的不算", () => {
    const messages = [user("u1"), assistant("a1"), summary("s1"), user("u2"), assistant("a2")];

    expect([...compactedMessageIds(messages)]).toEqual(["u1", "a1"]);
  });

  it("压缩过多次：以最新摘要为界，更早的摘要也一起算被压缩", () => {
    const messages = [user("u1"), summary("s1"), user("u2"), assistant("a2"), summary("s2"), user("u3")];

    expect([...compactedMessageIds(messages)]).toEqual(["u1", "s1", "u2", "a2"]);
  });

  it("没有摘要、或者摘要之前的历史还没分页加载出来，就没有被压缩的", () => {
    expect(compactedMessageIds([user("u1"), assistant("a1")]).size).toBe(0);
    expect(compactedMessageIds([summary("s1"), user("u2")]).size).toBe(0);
  });
});

describe("连续 assistant 消息合并遇到摘要", () => {
  it("摘要是分界线，不和前后的 assistant 消息并成一段", () => {
    const messages = [user("u1"), assistant("a1"), summary("s1"), assistant("a2"), assistant("a3")];

    const rows = groupAssistantMessages(messages);

    expect(rows.map((row) => row.id)).toEqual(["u1", "a1", "s1", "a2"]);
    expect(rows[2]).toBe(messages[2]);
  });
});

describe("CompactionSummary", () => {
  it("默认折叠：只显示分界条和被压缩的上文规模，不显示正文", () => {
    const wrapper = mount(CompactionSummary, { props: { message: summary("s") } });

    expect(wrapper.text()).toContain("上下文已压缩");
    expect(wrapper.text()).toContain(`约 ${(182000).toLocaleString()} tokens 的上文`);
    expect(wrapper.find(".summary-body").exists()).toBe(false);
  });

  it("点开后显示摘要正文，不带写给模型的前缀", async () => {
    const wrapper = mount(CompactionSummary, { props: { message: summary("s") } });

    await wrapper.find("button").trigger("click");

    expect(wrapper.find(".summary-body").text()).toContain("标题飘带素材在后台生成中");
    expect(wrapper.text()).not.toContain("另一个语言模型");
    expect(wrapper.find("button").attributes("aria-expanded")).toBe("true");
  });

  it("没有压缩统计时不显示规模提示", () => {
    const wrapper = mount(CompactionSummary, { props: { message: summary("s", { kind: "compaction_summary" }) } });

    expect(wrapper.find(".summary-hint").exists()).toBe(false);
  });
});

describe("insertCompactionSummary", () => {
  const messages = [user("u1"), assistant("a1"), user("u-current"), assistant("a-current")];

  it("自动压缩：排在保留下来的当前这轮之前", () => {
    const rows = insertCompactionSummary(messages, summary("s"), "u-current");

    expect(rows.map((m) => m.id)).toEqual(["u1", "a1", "s", "u-current", "a-current"]);
  });

  it("前端消息 id 和后端对不上时，排在最后一条用户消息之前", () => {
    const rows = insertCompactionSummary(messages, summary("s"), "server-side-id");

    expect(rows.map((m) => m.id)).toEqual(["u1", "a1", "s", "u-current", "a-current"]);
  });

  it("手动压缩（没有保留的当前这轮）：追加在最后", () => {
    expect(insertCompactionSummary(messages, summary("s")).map((m) => m.id)).toEqual([
      "u1",
      "a1",
      "u-current",
      "a-current",
      "s"
    ]);
  });

  it("同一条摘要不重复插入，也不改动原数组", () => {
    const once = insertCompactionSummary(messages, summary("s"), "u-current");
    const twice = insertCompactionSummary(once, summary("s"), "u-current");

    expect(twice.map((m) => m.id)).toEqual(once.map((m) => m.id));
    expect(messages).toHaveLength(4);
  });

  it("插入后上文随之算作已压缩", () => {
    const rows = insertCompactionSummary(messages, summary("s"), "u-current");

    expect([...compactedMessageIds(rows)]).toEqual(["u1", "a1"]);
  });
});
