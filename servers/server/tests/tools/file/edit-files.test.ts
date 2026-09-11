import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { editFilesTool } from "../../../src/mastra/tools/file/edit-files";
import { readFileState } from "../../../src/mastra/tools/file/state";
import { AgentMode } from "../../../src/mastra/types/bi-chat";
import { SuspendType } from "../../../src/mastra/types/suspend";

const tempDirs: string[] = [];

async function createTempFile(name: string, content: string): Promise<string> {
  const dir = await fsp.mkdtemp(path.join(os.tmpdir(), "edit-files-"));
  tempDirs.push(dir);
  const filePath = path.join(dir, name);
  await fsp.writeFile(filePath, content, "utf8");
  return filePath;
}

async function executeEditFiles(
  files: Array<{
    path: string;
    edits: Array<{ old_string: string; new_string: string; replace_all?: boolean }>;
  }>,
  options: {
    mode?: AgentMode;
    toolCallId?: string;
    resumeData?: Record<string, unknown>;
    onSuspend?: (payload: Record<string, unknown>) => void;
  } = {}
) {
  const execute = editFilesTool.execute as unknown as (
    input: { files: typeof files },
    context: Record<string, unknown>
  ) => Promise<unknown>;

  return execute(
    { files },
    {
      requestContext: {
        get: (key: string) => (key === "mode" ? (options.mode ?? AgentMode.AUTO_EDIT) : undefined)
      },
      agent: {
        toolCallId: options.toolCallId,
        resumeData: options.resumeData,
        suspend: async (payload: Record<string, unknown>) => {
          options.onSuspend?.(payload);
        }
      }
    }
  );
}

afterEach(async () => {
  readFileState.clear();
  await Promise.all(tempDirs.splice(0).map((dir) => fsp.rm(dir, { recursive: true, force: true })));
});

describe("edit_files", () => {
  it("continues editing later files when one file fails", async () => {
    const firstPath = await createTempFile("first.txt", "alpha");
    const failedPath = await createTempFile("failed.txt", "unchanged");
    const thirdPath = await createTempFile("third.txt", "gamma");

    const result = (await executeEditFiles([
      { path: firstPath, edits: [{ old_string: "alpha", new_string: "one" }] },
      { path: failedPath, edits: [{ old_string: "missing", new_string: "two" }] },
      { path: thirdPath, edits: [{ old_string: "gamma", new_string: "three" }] }
    ])) as {
      success: boolean;
      total: number;
      succeeded: number;
      failed: number;
      replacements: number;
      results: Array<{ path: string; success: boolean }>;
    };

    expect(result).toMatchObject({
      success: false,
      total: 3,
      succeeded: 2,
      failed: 1,
      replacements: 2
    });
    expect(result.results.map(({ path: resultPath, success }) => ({ path: resultPath, success }))).toEqual([
      { path: firstPath, success: true },
      { path: failedPath, success: false },
      { path: thirdPath, success: true }
    ]);
    await expect(fsp.readFile(firstPath, "utf8")).resolves.toBe("one");
    await expect(fsp.readFile(failedPath, "utf8")).resolves.toBe("unchanged");
    await expect(fsp.readFile(thirdPath, "utf8")).resolves.toBe("three");
  });

  it("suspends and resumes once for every file in ask-before-edit mode", async () => {
    const firstPath = await createTempFile("first.txt", "alpha");
    const secondPath = await createTempFile("second.txt", "beta");
    const files = [
      { path: firstPath, edits: [{ old_string: "alpha", new_string: "one" }] },
      { path: secondPath, edits: [{ old_string: "beta", new_string: "two" }] }
    ];
    const toolCallId = "edit-files-multi-suspend";
    const suspendedPayloads: Array<Record<string, unknown>> = [];
    const onSuspend = (payload: Record<string, unknown>) => suspendedPayloads.push(payload);

    await executeEditFiles(files, {
      mode: AgentMode.ASK_BEFORE_EDIT,
      toolCallId,
      onSuspend
    });

    expect(suspendedPayloads).toHaveLength(1);
    expect(suspendedPayloads[0]).toMatchObject({
      type: SuspendType.AskApproval,
      filePath: firstPath
    });
    await expect(fsp.readFile(firstPath, "utf8")).resolves.toBe("alpha");

    await executeEditFiles(files, {
      mode: AgentMode.ASK_BEFORE_EDIT,
      toolCallId,
      resumeData: {
        approved: true,
        batchId: suspendedPayloads[0].batchId,
        operationId: suspendedPayloads[0].operationId
      },
      onSuspend
    });

    expect(suspendedPayloads).toHaveLength(2);
    expect(suspendedPayloads[1]).toMatchObject({
      type: SuspendType.AskApproval,
      filePath: secondPath,
      batchId: suspendedPayloads[0].batchId
    });
    expect(suspendedPayloads[1].operationId).not.toBe(suspendedPayloads[0].operationId);
    await expect(fsp.readFile(firstPath, "utf8")).resolves.toBe("one");
    await expect(fsp.readFile(secondPath, "utf8")).resolves.toBe("beta");

    const result = (await executeEditFiles(files, {
      mode: AgentMode.ASK_BEFORE_EDIT,
      toolCallId,
      resumeData: {
        approved: true,
        batchId: suspendedPayloads[1].batchId,
        operationId: suspendedPayloads[1].operationId
      },
      onSuspend
    })) as {
      success: boolean;
      total: number;
      succeeded: number;
      failed: number;
    };

    expect(suspendedPayloads).toHaveLength(2);
    expect(result).toMatchObject({ success: true, total: 2, succeeded: 2, failed: 0 });
    await expect(fsp.readFile(secondPath, "utf8")).resolves.toBe("two");
  });
});
