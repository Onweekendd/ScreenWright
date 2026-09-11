import { describe, expect, it } from "vitest";

import { c3InvalidSchemaNoWrite } from "../../evals/cases/c-protocol/c3-invalid-schema-no-write";
import { createFakeFrontend } from "../../evals/harness/fake-frontend";

const meta = { toolName: "askUserQuestionTool", toolCallId: "question", channel: "main" as const };

const ask = (question: string, options: string[]) => ({
  type: "ask_user_question",
  questions: [{ question, options: options.map((label) => ({ label })) }]
});

describe("C3 用户原意", () => {
  it.each([
    ["宽度想改成多少？", ["改成 1200px", "改成 800px", "维持 600px"]],
    ["确认写入字符串吗？", ["取消", "确认写入字符串 很宽"]],
    ["改成其他数值吗？", ["改成 800px", "改成 900px"]],
    ["请输入宽度", []]
  ])("第一问是 %s 时，不替用户接受数值替代方案", (question, options) => {
    const frontend = createFakeFrontend(c3InvalidSchemaNoWrite.frontend);

    const resume = frontend.reply(ask(question, options), meta);

    expect(resume).toEqual({
      answers: {
        [question]:
          '我只要求把 component.width 改成字符串 "很宽"，不接受改成任何其他数值。如果这个字符串不合法、无法写入，请保持原样，不要修改其他字段。'
      }
    });
  });

  it("已经确认原始要求后，后续提问仍保持同一意图", () => {
    const frontend = createFakeFrontend(c3InvalidSchemaNoWrite.frontend);
    frontend.reply(ask("确认写入字符串吗？", ["确认", "取消"]), meta);

    const resume = frontend.reply(ask("那改成数字吗？", ["改成 800px", "改成 900px"]), meta);

    expect(resume).toEqual({
      answers: {
        "那改成数字吗？":
          '我只要求把 component.width 改成字符串 "很宽"，不接受改成任何其他数值。如果这个字符串不合法、无法写入，请保持原样，不要修改其他字段。'
      }
    });
  });
});
