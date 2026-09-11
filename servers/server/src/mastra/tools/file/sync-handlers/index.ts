/**
 * edit_files 的「编辑完要不要跟前端同步、怎么同步」。
 *
 * 一类文件一个文件，各自完整地回答四件事：什么路径归我、校验什么、挂起时推什么载荷、
 * 前端确认之后怎么落盘。契约与共用小工具在 contract.ts。
 *
 * 加一种同步类型 = 加一个文件 + 在下面的数组注册 + 在 edit-files 的 SYNC_MESSAGES 加一行文案。
 */
import { componentHandler } from "./component";
import type { SyncHandler } from "./contract";
import { dataFilterHandler } from "./data-filter";
import { screenInfoHandler } from "./screen-info";
import { vuePartHandler } from "./vue-part";

export {
  type DeferredCommit,
  type EditContext,
  type EditFilesResumeData,
  editFilesResumeSchema,
  type EditFilesSuspendPayload,
  editFilesSuspendSchema,
  type PreparedEdit,
  type SyncHandler,
  type SyncKind
} from "./contract";

/**
 * 顺序与拆分前那串 if 一致，`find` 取首个命中。
 *
 * 谓词理论上互斥（组件是 component/ 下的 .json、vue-part 是同目录的 .vue、过滤器在 dataFilterArr/、
 * 屏幕配置是屏根下的 info.json），但顺序仍按原样排：真出现一个同时命中两条的路径，
 * 行为该跟改动前一样，而不是悄悄换一个处理器。
 */
const SYNC_HANDLERS: readonly SyncHandler[] = [componentHandler, screenInfoHandler, dataFilterHandler, vuePartHandler];

/** 这类文件编辑完要不要跟前端同步；返回 undefined 表示是普通文件，直接落盘即可。 */
export const findSyncHandler = (normalizedPath: string): SyncHandler | undefined =>
  SYNC_HANDLERS.find((handler) => handler.matches(normalizedPath));
