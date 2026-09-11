import { ComponentTreeCapture, Utils } from "../captureUtils";
import { UeStreamCapture } from "../media/ueStreamCapture";
import { VideoNormal } from "../media/videoNormal";
import {
  CaptureStrategyFactory,
  createDomStrategy,
  createFontDomStrategy,
  createGroupComponentStrategy,
  createPanelStrategy,
  createSpecialComponentStrategy,
  createVideoStrategy,
  registerFontDomStrategy,
  registerSpecialComponentStrategy,
  registerVideoStrategy
} from "../strategies";
import type { CaptureModuleContext } from "../strategies/types";
import type {
  CaptureComponentItem,
  CaptureLayer,
  ComponentList,
  DesignSize,
  ModuleDescriptor,
  SnapshotMap
} from "../types/captureInternal";
import { VideoDataCapture } from "../videoDataCapture";

export interface StrategyWiringDeps {
  PanelCapture: {
    isPanelHost(host: HTMLElement, hostId: string, componentList: ComponentList): boolean;
    buildLayer: (
      descriptor: ModuleDescriptor,
      viewWrapper: HTMLElement,
      designSize: DesignSize,
      componentList: ComponentList
    ) => Promise<CaptureLayer | null>;
  };
  GroupCapture: {
    isGroupComponent(item: CaptureComponentItem | null | undefined): boolean;
    buildLayer: (
      descriptor: ModuleDescriptor,
      viewWrapper: HTMLElement,
      designSize: DesignSize,
      componentList: ComponentList
    ) => Promise<CaptureLayer | null>;
  };
  DomOverlayCapture: {
    prepareWrapper(viewWrapper: HTMLElement, designSize: DesignSize): () => void;
    buildSnapshotsAsync(root: HTMLElement, componentList: ComponentList): Promise<SnapshotMap>;
    applyLiveMediaPatches(root: HTMLElement, snapshots: SnapshotMap): () => void;
    applyMediaPatchesOnClone(clonedDoc: Document | HTMLElement, snapshots: SnapshotMap, liveRoot?: HTMLElement): void;
    capturePerComponent: (
      descriptor: ModuleDescriptor,
      viewWrapper: HTMLElement,
      designSize: DesignSize,
      componentList: ComponentList
    ) => Promise<CaptureLayer | null>;
  };
  ImageCapture: {
    applyCrossOriginOnLive(root: HTMLElement): () => void;
  };
  Readiness: {
    waitImagesReady(root: HTMLElement, timeoutMs?: number): Promise<void>;
  };
  hostHasSpecialMarker: (host: HTMLElement) => boolean;
}

export function wireCaptureStrategies(deps: StrategyWiringDeps) {
  const { PanelCapture, GroupCapture, DomOverlayCapture, ImageCapture, Readiness, hostHasSpecialMarker } = deps;

  const isPanelModule = (ctx: CaptureModuleContext) =>
    ctx.module.primaryMode === "panelShell" ||
    PanelCapture.isPanelHost(ctx.module.host, ctx.module.id, ctx.componentList);

  const isGroupModule = (ctx: CaptureModuleContext) => {
    if (isPanelModule(ctx)) {
      return false;
    }
    if (ctx.module.primaryMode === "groupShell") {
      return true;
    }
    const item = ComponentTreeCapture.findComponentById(ctx.componentList, ctx.module.id);
    return !!(
      item &&
      Array.isArray(item.children) &&
      item.children.length > 0 &&
      GroupCapture.isGroupComponent(item) &&
      !ComponentTreeCapture.isPanelComponent(item)
    );
  };

  const specialComponentStrategyInstance = createSpecialComponentStrategy({
    prepareWrapper: DomOverlayCapture.prepareWrapper.bind(DomOverlayCapture),
    waitImagesReady: Readiness.waitImagesReady.bind(Readiness),
    isGroupModule,
    isPanelModule,
    buildSnapshotsAsync: DomOverlayCapture.buildSnapshotsAsync.bind(DomOverlayCapture),
    applyLiveMediaPatches: DomOverlayCapture.applyLiveMediaPatches.bind(DomOverlayCapture),
    applyCrossOriginOnLive: ImageCapture.applyCrossOriginOnLive.bind(ImageCapture),
    applyMediaPatchesOnClone: DomOverlayCapture.applyMediaPatchesOnClone.bind(DomOverlayCapture)
  });
  registerSpecialComponentStrategy(specialComponentStrategyInstance);

  const videoCaptureEngine = {
    buildStreamLayer(descriptor: ModuleDescriptor, designSize: DesignSize) {
      return UeStreamCapture.buildLayer(descriptor, designSize);
    },
    buildNormalLayer(descriptor: ModuleDescriptor, designSize: DesignSize, componentList: ComponentList) {
      return VideoNormal.buildLayer(descriptor, designSize, componentList);
    },
    async captureFtVideoLayer(descriptor: ModuleDescriptor, designSize: DesignSize, componentList: ComponentList) {
      const layer = await VideoNormal.buildLayer(descriptor, designSize, componentList);
      if (layer) {
        return layer;
      }
      Utils.log("warn", "ft-video 抓帧失败", descriptor.id);
      return null;
    },
    async captureOpenVideoLayer(descriptor: ModuleDescriptor, _designSize: DesignSize, componentList: ComponentList) {
      const dataUrl = await VideoDataCapture.captureVideoDataUrl({
        componentId: descriptor.id,
        componentList,
        seekTime: 0,
        host: descriptor.host
      });
      if (dataUrl) {
        return {
          id: descriptor.id,
          kind: "dom",
          zIndex: descriptor.zIndex,
          designRect: descriptor.designRect,
          dataUrl
        };
      }
      Utils.log("warn", "开场视频抓帧失败", descriptor.id);
      return null;
    },
    async captureOtherVideoLayer(descriptor: ModuleDescriptor, designSize: DesignSize, componentList: ComponentList) {
      return VideoNormal.buildLayer(descriptor, designSize, componentList);
    },
    waitReady(root: HTMLElement) {
      return VideoNormal.waitReady(root);
    },
    hideForLiveCapture(root: HTMLElement) {
      return VideoNormal.hideForLiveCapture(root);
    },
    hideInClone(clonedDoc: Document | HTMLElement) {
      VideoNormal.hideInClone(clonedDoc);
    }
  };

  const videoStrategyInstance = createVideoStrategy({
    engine: videoCaptureEngine,
    isGroupModule,
    isPanelModule
  });
  registerVideoStrategy(videoStrategyInstance);

  const fontDomStrategyInstance = createFontDomStrategy({
    captureTextComponent: DomOverlayCapture.capturePerComponent.bind(DomOverlayCapture),
    isGroupModule,
    isPanelModule,
    hostHasSpecialMarker
  });
  registerFontDomStrategy(fontDomStrategyInstance);

  CaptureStrategyFactory.register([
    createPanelStrategy({
      buildLayer: PanelCapture.buildLayer.bind(PanelCapture),
      isPanelModule
    }),
    createGroupComponentStrategy({
      isGroupModule,
      buildLayer: GroupCapture.buildLayer.bind(GroupCapture),
      capturePerComponent: DomOverlayCapture.capturePerComponent.bind(DomOverlayCapture)
    }),
    specialComponentStrategyInstance,
    videoStrategyInstance,
    fontDomStrategyInstance,
    createDomStrategy({
      capturePerComponent: DomOverlayCapture.capturePerComponent.bind(DomOverlayCapture)
    })
  ]);

  return { isPanelModule, isGroupModule };
}
