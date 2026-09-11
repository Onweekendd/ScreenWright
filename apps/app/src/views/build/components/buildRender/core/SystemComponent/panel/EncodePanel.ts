import { DataType } from "@/views/build/components/buildRender/type";

import { SystemBase } from "../SystemBase";
import type { PanelState, SystemComponentProps } from "../type";
import { PanelType } from "../type";

export interface EncodePanelOptions {
  /** @description 是否显示 */
  display: boolean;

  /** @description 是否启用打开功能 */
  enableOpen: boolean;

  /** @description 是否启用滚动 */
  enableScroll: boolean;

  /** @description 是否隐藏加载中状态 */
  hiddenLoading: boolean;
}

export interface EncodePanelProps extends SystemComponentProps {
  /**
   * @description 动态面板配置
   */
  option: EncodePanelOptions;
}

export const defaultEncodePanelOptions: EncodePanelOptions = {
  display: true,
  enableOpen: true,
  enableScroll: false,
  hiddenLoading: false
};

class EncodePanel extends SystemBase<EncodePanelOptions> {
  options: EncodePanelOptions = defaultEncodePanelOptions;

  panelData: PanelState[] = [];

  constructor() {
    const defaultBaseChartProps: SystemComponentProps<PanelType.encodePanel> & { groupName: string; type: string } = {
      component: {
        prop: PanelType.encodePanel,
        width: 400,
        height: 300,
        name: "终端交互"
      },
      left: 0,
      top: 0,
      id: Date.now(),
      name: "终端交互",
      groupName: "终端交互",
      type: "encodePanel",
      img: "",
      data: [],
      yAxisType: "value",
      option: {},
      dataType: DataType.STATIC,
      dataRemark: [],
      listenArgs: [],
      openFilter: false,
      isLock: false,
      zIndex: 0,
      display: true,
      title: "",
      dataSource: {},
      events: [],
      cbArgs: [],
      panelData: [],
      activeStatusId: null,
      loadAnimation: {
        type: "",
        timingFunction: "",
        duration: 0,
        delay: 0
      }
    };
    super(defaultBaseChartProps);
  }
  init(dynamicPanelProps: EncodePanelProps): void {
    this.updateBaseProps(dynamicPanelProps);

    this.options = dynamicPanelProps.option;
  }
  getOptions(): EncodePanelOptions {
    return this.options;
  }
}

export { EncodePanel };
