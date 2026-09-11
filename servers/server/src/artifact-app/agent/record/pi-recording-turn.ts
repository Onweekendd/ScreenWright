/**
 * Pi Agent 的录制 turn 边界：一次 run（执行一个编码任务）= 档案里的一个 turn，
 * turn 内每次模型往返 = 一个 step_NN.json。
 *
 * 与 Mastra 侧共用同一个入口（见 @/recording/recording-scope 的 withRecordingTurn），
 * 只是各自的 turn 边界不同：那边是一轮对话，这边是一次任务执行。
 */
import { withRecordingTurn } from "@/recording/recording-scope";

export interface PiRecordingIdentity {
  readonly appId: string;
  readonly taskListId: string;
}

/**
 * 档案里的 thread 名。前缀 pi- 让阅卷室能一眼分辨来源
 * （Pi 记录没有对应的 mastra thread，标题会是空的）。
 */
export function piRecordingThreadId(identity: PiRecordingIdentity): string {
  return `pi-${identity.appId}-${identity.taskListId}`;
}

/** 在一个录制 turn 里执行一次任务；未开启 RECORD_LLM 时 withRecordingTurn 会直接执行 fn。 */
export function runInPiRecordingTurn<T>(identity: PiRecordingIdentity, fn: () => Promise<T>): Promise<T> {
  return withRecordingTurn({ threadId: piRecordingThreadId(identity) }, fn);
}
