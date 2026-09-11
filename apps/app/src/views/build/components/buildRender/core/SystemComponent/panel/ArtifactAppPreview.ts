import type { ArtifactAppPreviewOption, ComponentType } from "@screenwright/types";

import { DataType } from "../../../type";
import { SystemBase } from "../SystemBase";
import { PanelType } from "../type";

export type ArtifactAppPreviewProps = ComponentType<PanelType.artifactAppPreview, ArtifactAppPreviewOption, []>;

/** Artifact 应用预览低代码组件。 */
class ArtifactAppPreview extends SystemBase<ArtifactAppPreviewOption> {
  constructor() {
    const defaultProps: ArtifactAppPreviewProps & { groupName: string; type: string } = {
      cbArgs: [],
      component: {
        height: 600,
        name: "Artifact 应用预览",
        prop: PanelType.artifactAppPreview,
        width: 960
      },
      data: [],
      dataSource: {},
      dataType: DataType.STATIC,
      display: true,
      events: [],
      groupName: "系统组件",
      id: Date.now(),
      img: "",
      isLock: false,
      left: 0,
      listenArgs: [],
      loadAnimation: {
        delay: 0,
        duration: 0,
        timingFunction: "linear",
        type: "none"
      },
      name: "Artifact 应用预览",
      option: {
        appId: "",
        allowInteraction: true,
        previewMode: "development",
        showStatus: true
      },
      title: "",
      top: 0,
      type: "artifactAppPreview",
      zIndex: 0
    };
    super(defaultProps);
    this.options = defaultProps.option;
  }

  init(baseProps: ArtifactAppPreviewProps): void {
    this.updateBaseProps(baseProps);
    this.options = baseProps.option;
  }

  getOptions(): ArtifactAppPreviewOption {
    return this.options;
  }
}

export { ArtifactAppPreview };
