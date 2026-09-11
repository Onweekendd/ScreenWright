import { setMinioUrl } from "@/utils/config";

import { getCurrentMapRegionSelection } from "../mapRegionCatalog";

export const isEchartGlmapSceneComponent = (component: any) => {
  const option = component?.option;

  return Boolean(
    component &&
      Array.isArray(component.presetChild) &&
      option?.sceneControl &&
      option?.camera &&
      option?.light &&
      option?.hoverLift &&
      option?.textStyle
  );
};

export const ensureEchartGlmapViewManager = (component: any) => {
  if (!component?.option) {
    return {
      sceneList: [],
      viewList: []
    };
  }

  if (!component.option.viewManager || typeof component.option.viewManager !== "object") {
    component.option.viewManager = {
      sceneList: [],
      viewList: []
    };
  }

  if (!Array.isArray(component.option.viewManager.sceneList)) {
    component.option.viewManager.sceneList = [];
  }

  if (!Array.isArray(component.option.viewManager.viewList)) {
    component.option.viewManager.viewList = [];
  }

  return component.option.viewManager;
};

export const buildEchartGlmapEditorProps = (component: any) => {
  const opt = component.option;
  const regionSelection = getCurrentMapRegionSelection(component.data);

  return {
    adcode: regionSelection.adcode || "100000",
    mapSource: {
      regionId: regionSelection.id,
      provider: regionSelection.provider,
      geoJsonUrl: regionSelection.geoJsonUrl,
      allowDrillDown: regionSelection.allowDrillDown
    },
    fillType: opt.fillType,
    areaColor: opt.areaColor || "#171a24",
    activeAreaColor: opt.activeAreaColor || "#FF00FF",
    picture: setMinioUrl(opt?.picture),
    normalMap: setMinioUrl(opt?.normalMap),
    normalMapIntensity: opt?.normalMapIntensity,
    activePicture: setMinioUrl(opt?.activePicture),
    uvScaleX: opt.uvScaleX !== undefined ? opt.uvScaleX : 1,
    uvScaleY: opt.uvScaleY !== undefined ? opt.uvScaleY : 1,
    uvOffsetX: opt.uvOffsetX !== undefined ? opt.uvOffsetX : 0,
    uvOffsetY: opt.uvOffsetY !== undefined ? opt.uvOffsetY : 0,
    uvRotation: opt.uvRotation || 0,
    borderWidth: opt?.borderWidth,
    borderColor: opt.borderColor,
    sideGlowColor: opt.sideGlowColor,
    sideGlowStrength: opt.sideGlowStrength,
    activeBorderColor: opt.activeBorderColor,
    defaultLiftAdcode: opt.defaultLiftAdcode || "",
    textStyle: {
      fontFamily: opt.textStyle.fontFamily || "Arial",
      fontSize: opt.textStyle.fontSize * 2,
      color: opt.textStyle.color || "rgba(255, 255, 255, 1)",
      fontStyle: opt.textStyle.fontStyle || "normal",
      fontWeight: opt.textStyle.fontWeight || "normal"
    },
    sceneControl: {
      beta: opt?.beta || undefined,
      regionHeight: opt.sceneControl.regionHeight * 0.1,
      autoRotate: opt.sceneControl.autoRotate || false,
      rotateSpeed: opt?.rotateSpeed || 0.01,
      initialRotationAngle: 0,
      mapRotationAngle: opt.sceneControl.mapRotationAngle * -1,
      bloom: opt.sceneControl?.bloom,
      innerShadow: opt.sceneControl?.innerShadow
    },
    backgroundColor: opt?.backgroundColor || 0x000000,
    fog: opt?.fog || false,
    fogColor: opt?.fogColor || 0x000000,
    camera: {
      distance: opt.camera.distance * 0.05,
      verticalTiltAngle: opt.camera.verticalTiltAngle * -1,
      horizontalRotationAngle: opt.camera.horizontalRotationAngle * -1
    },
    light: {
      ambientIntensity: opt.light.ambientIntensity,
      ambientColor: opt.light.ambientColor ? opt.light.ambientColor : "fff8e1",
      directionalIntensity: opt.light.directionalIntensity,
      directionalColor: opt.light.directionalColor ? opt.light.directionalColor : "fff8e1"
    },
    mouseControl: {
      zoomSpeed: opt?.mouseControlZoomSpeed !== undefined ? opt.mouseControlZoomSpeed : 25,
      panSpeed: opt?.mouseControlPanSpeed !== undefined ? opt.mouseControlPanSpeed : 10,
      rotateSpeed: opt?.mouseControlRotateSpeed !== undefined ? opt.mouseControlRotateSpeed : 25
    },
    hoverLift: {
      height: (opt.hoverLift.hoverLiftHeight ?? opt.hoverLift.height ?? 1) * 0.01,
      duration: opt.hoverLift.hoverLiftDuration ?? opt.hoverLift.duration ?? 300
    },
    presetChild: component.presetChild
  };
};
