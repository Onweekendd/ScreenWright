import { DataType } from "../../../type";
import { SystemBase } from "../SystemBase";
import type { SystemComponentProps } from "../type";
import { PanelType } from "../type";

class QuotePanel extends SystemBase<{}> {
  constructor() {
    const defaultBaseChartProps: SystemComponentProps<PanelType.quotePanel> & { groupName: string; type: string } = {
      component: {
        prop: PanelType.quotePanel,
        width: 400,
        height: 300,
        name: "引用面板"
      },
      left: 0,
      top: 0,
      id: Date.now(),
      name: "引用面板",
      groupName: "引用面板",
      type: "quotePanel",
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
  init(): void {
    console.log("引用面板init");
  }
  getOptions(): {} {
    return this.options;
  }
}
export { QuotePanel };
