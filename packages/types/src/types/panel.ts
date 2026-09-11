import type { ComponentType } from "./component";
import { PanelEnum } from "./componentProp";

export { PanelEnum as PanelType };

export type SystemComponentProps<T extends PanelEnum = PanelEnum> = ComponentType<T> & {
  /**
   * @description 动态面板数据
   */
  panelData: PanelState[];

  /**
   * @description 当前激活状态
   */
  activeStatusId: string | null;
};

export interface PanelState {
  /**
   * @description 状态ID
   */
  id: string;

  /**
   * @description 状态标题-不变
   */
  title: string;

  /**
   * @description 状态名称
   */
  name: string;

  /**
   * @description 动态面板内部组件
   */
  config: ComponentType[];

  /**
   * @description 背景颜色
   */
  backgroundColor: string;

  /**
   * @description 是否显示背景图片
   */
  showBackgroundImage: boolean;

  /**
   * @description 背景图片
   */
  backgroundImage: string;

  /**
   * @description 是否显示屏幕适配
   */
  showScreenAdaptation: boolean;

  /**
   * @description 资源ID
   */
  minioIds?: Array<number | null>;

  /**
   * @description 屏幕适配类型
   */
  adaptationNorm: string;

  adaptationType: number;
}
