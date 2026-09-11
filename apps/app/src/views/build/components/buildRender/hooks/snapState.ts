/**
 * 拖拽吸附状态管理
 *
 * 实现基于状态模式的吸附系统，独立管理水平和垂直方向的吸附状态
 */

/**
 * 吸附状态枚举
 */
export enum SnapState {
  NORMAL = "normal", // 正常状态：自由拖拽
  SNAPPED = "snapped" // 吸附状态：锁定在对齐线上
}

/**
 * 轴向枚举
 */
export enum Axis {
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical"
}

/**
 * 单轴吸附状态管理类
 *
 * 管理单个轴向（水平或垂直）的吸附状态和状态转换逻辑
 */
export class AxisSnapState {
  // 当前状态
  private state: SnapState = SnapState.NORMAL;

  // 吸附目标位置（对齐线位置）
  private snapTarget: number | null = null;

  // 进入吸附状态时的鼠标位置
  private snapEntryPosition: number | null = null;

  // 累计拖拽距离（用于判断是否脱离吸附）
  private accumulatedDrag: number = 0;

  // 容差值
  private tolerance: number;

  constructor(tolerance: number) {
    this.tolerance = tolerance;
  }

  /**
   * 检查是否应该进入吸附状态
   *
   * @param offset - WASM 返回的对齐偏移量
   * @returns 是否应该进入吸附状态
   */
  public shouldEnterSnap(offset: number): boolean {
    return this.state === SnapState.NORMAL && offset !== 0;
  }

  /**
   * 进入吸附状态
   *
   * @param targetPosition - 对齐线的目标位置
   * @param currentPosition - 当前鼠标位置
   */
  public enterSnap(targetPosition: number, currentPosition: number): void {
    this.state = SnapState.SNAPPED;
    this.snapTarget = targetPosition;
    this.snapEntryPosition = currentPosition;
    this.accumulatedDrag = 0;
  }

  /**
   * 更新累计拖拽距离
   *
   * @param currentPosition - 当前鼠标位置
   */
  public updateDrag(currentPosition: number): void {
    if (this.state === SnapState.SNAPPED && this.snapEntryPosition !== null) {
      this.accumulatedDrag = Math.abs(currentPosition - this.snapEntryPosition);
    }
  }

  /**
   * 检查是否应该脱离吸附
   *
   * @returns 是否应该脱离吸附状态
   */
  public shouldExitSnap(): boolean {
    return this.state === SnapState.SNAPPED && this.accumulatedDrag > this.tolerance;
  }

  /**
   * 脱离吸附状态
   */
  public exitSnap(): void {
    this.state = SnapState.NORMAL;
    this.snapTarget = null;
    this.snapEntryPosition = null;
    this.accumulatedDrag = 0;
  }

  /**
   * 获取当前应用的位置
   *
   * @param draggedPosition - 拖拽的目标位置
   * @returns 应用吸附后的最终位置
   */
  public getAppliedPosition(draggedPosition: number): number {
    if (this.state === SnapState.SNAPPED && this.snapTarget !== null) {
      return this.snapTarget; // 返回锁定的对齐线位置
    }
    return draggedPosition; // 返回正常拖拽位置
  }

  /**
   * 重置状态（拖拽结束时调用）
   */
  public reset(): void {
    this.state = SnapState.NORMAL;
    this.snapTarget = null;
    this.snapEntryPosition = null;
    this.accumulatedDrag = 0;
  }

  /**
   * 获取当前状态（用于调试）
   *
   * @returns 当前吸附状态
   */
  public getState(): SnapState {
    return this.state;
  }

  /**
   * 获取累计拖拽距离（用于调试）
   *
   * @returns 累计拖拽距离
   */
  public getAccumulatedDrag(): number {
    return this.accumulatedDrag;
  }
}

/**
 * 对齐结果接口（与 WASM 返回的结果一致）
 */
export interface AlignmentResult {
  offset_x: number;
  offset_y: number;
}

/**
 * 处理对齐的参数接口
 */
export interface ProcessAlignmentParams {
  alignmentResult: AlignmentResult;
  currentX: number;
  currentY: number;
  draggedX: number;
  draggedY: number;
}

/**
 * 处理单轴对齐的参数接口
 */
export interface ProcessAxisParams {
  axisState: AxisSnapState;
  offset: number;
  currentPosition: number;
  draggedPosition: number;
}

/**
 * 双轴吸附管理器
 *
 * 协调水平和垂直两个方向的独立吸附状态
 */
export class DualAxisSnapManager {
  private horizontalSnap: AxisSnapState;
  private verticalSnap: AxisSnapState;

  constructor(tolerance: number) {
    this.horizontalSnap = new AxisSnapState(tolerance);
    this.verticalSnap = new AxisSnapState(tolerance);
  }

  /**
   * 处理对齐结果并更新状态
   *
   * @param params - 处理对齐的参数对象
   * @returns 应用吸附后的最终位置
   */
  public processAlignment(params: ProcessAlignmentParams): { finalX: number; finalY: number } {
    // 处理水平方向
    const finalX = this.processAxis({
      axisState: this.horizontalSnap,
      offset: params.alignmentResult.offset_x,
      currentPosition: params.currentX,
      draggedPosition: params.draggedX
    });

    // 处理垂直方向
    const finalY = this.processAxis({
      axisState: this.verticalSnap,
      offset: params.alignmentResult.offset_y,
      currentPosition: params.currentY,
      draggedPosition: params.draggedY
    });

    return { finalX, finalY };
  }

  /**
   * 处理单个轴向的状态转换
   *
   * @param params - 处理单轴对齐的参数对象
   * @returns 应用吸附后的最终位置
   */
  private processAxis(params: ProcessAxisParams): number {
    const { axisState, offset, currentPosition, draggedPosition } = params;

    // 状态转换逻辑

    // 1. 检查是否应该进入吸附
    if (axisState.shouldEnterSnap(offset)) {
      const targetPosition = draggedPosition + offset;
      axisState.enterSnap(targetPosition, currentPosition);
      return targetPosition;
    }

    // 2. 如果已经在吸附状态，更新累计拖拽距离
    if (axisState.getState() === SnapState.SNAPPED) {
      axisState.updateDrag(currentPosition);

      // 3. 检查是否应该脱离吸附
      if (axisState.shouldExitSnap()) {
        axisState.exitSnap();
        return draggedPosition;
      }

      // 4. 保持吸附状态，返回锁定位置
      return axisState.getAppliedPosition(draggedPosition);
    }

    // 5. 正常状态，直接返回拖拽位置
    return draggedPosition;
  }

  /**
   * 重置所有状态（拖拽结束时调用）
   */
  public reset(): void {
    this.horizontalSnap.reset();
    this.verticalSnap.reset();
  }

  /**
   * 获取当前状态（用于调试）
   *
   * @returns 水平和垂直方向的当前状态
   */
  public getStates(): { horizontal: SnapState; vertical: SnapState } {
    return {
      horizontal: this.horizontalSnap.getState(),
      vertical: this.verticalSnap.getState()
    };
  }

  /**
   * 获取累计拖拽距离（用于调试）
   *
   * @returns 水平和垂直方向的累计拖拽距离
   */
  public getAccumulatedDrags(): { horizontal: number; vertical: number } {
    return {
      horizontal: this.horizontalSnap.getAccumulatedDrag(),
      vertical: this.verticalSnap.getAccumulatedDrag()
    };
  }
}
