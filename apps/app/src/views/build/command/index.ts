/**
 * 命令模式实现
 * 提供了完整的历史记录管理和撤销/重做功能
 *
 * @example
 * ```typescript
 * // 基本使用
 * import { useCommandHistory } from '@/command'
 *
 * const { executeUpdateComponent, undo, redo, canUndo, canRedo } = useCommandHistory()
 *
 * // 更新组件
 * await executeUpdateComponent([updatedComponent])
 *
 * // 撤销
 * if (canUndo.value) {
 *   await undo()
 * }
 *
 * // 重做
 * if (canRedo.value) {
 *   await redo()
 * }
 * ```
 *
 * @example
 * ```typescript
 * // 高级用法 - 自定义命令
 * import {
 *   CommandManager,
 *   BaseCommand,
 *   UpdateComponentCommand,
 *   AddComponentCommand,
 *   DeleteComponentCommand
 * } from '@/command'
 *
 * // 创建自定义命令
 * class CustomCommand extends BaseCommand {
 *   protected async doUndo() {
 *     // 自定义撤销逻辑
 *   }
 *
 *   protected async doRedo() {
 *     // 自定义重做逻辑
 *   }
 * }
 *
 * // 使用命令管理器
 * const commandManager = new CommandManager()
 * const customCommand = new CustomCommand("自定义操作")
 * commandManager.addCommand(customCommand)
 * ```
 */

// 导出基础命令类和接口
export type { CommandResult, ICommand } from "./BaseCommand";
export { BaseCommand } from "./BaseCommand";

// 导出具体命令类
export { AddComponentCommand } from "./AddComponentCommand";
export { AddPanelStateCommand } from "./AddPanelStateCommand";
export { CopyPanelStateCommand } from "./CopyPanelStateCommand";
export { DeleteComponentCommand } from "./DeleteComponentCommand";
export { DeleteGroupCommand } from "./DeleteGroupCommand";
export { DeletePanelStateCommand } from "./DeletePanelStateCommand";
export { RemoveGroupMemberCommand } from "./RemoveGroupMemberCommand";
export { ReorderPanelStateCommand } from "./ReorderPanelStateCommand";
export { ToggleGroupCommand } from "./ToggleGroupCommand";
export { UpdateComponentCommand } from "./UpdateComponentCommand";

// 导出命令管理器
export { CommandManager } from "./CommandManager";

// 导出整合的hooks（主要API）
export { useCommandHistory } from "./useCommandHistory";

/**
 * 命令模式的核心概念说明：
 *
 * 1. **BaseCommand**: 抽象命令基类，定义了命令的基本结构
 * 2. **UpdateComponentCommand**: 更新组件命令，处理组件更新和撤销
 * 3. **AddComponentCommand**: 添加组件命令，处理组件添加和删除
 * 4. **DeleteComponentCommand**: 删除组件命令，处理组件删除和恢复
 * 5. **CommandManager**: 命令管理器，负责命令的执行、撤销和重做
 * 6. **useCommandHistory**: 整合的hooks，提供了简化的API
 *
 * 优势：
 * - 职责单一：每个命令只负责一种操作
 * - 易于扩展：可以轻松添加新的命令类型
 * - 可撤销：所有操作都支持撤销和重做
 * - 解耦合：命令的执行和历史记录管理完全分离
 * - 可测试：每个命令都可以独立测试
 */
