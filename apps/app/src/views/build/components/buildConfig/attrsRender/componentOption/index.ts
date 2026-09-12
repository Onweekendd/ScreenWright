import { baseComponentOptions } from "./baseComponent";
import { exhibitEnumComponentOptions } from "./exhibitComponent";
import { extendsComponentOptions } from "./extendsComponent";
import { iframeComponentOptions } from "./iframeComponent";
import { indicatorComponentOptions } from "./indicatorComponent";
import { interactiveEnumComponentOptions } from "./interactiveComponent";
import { mediaComponentOptions } from "./mediaComponent";
import { sceneComponentOptions } from "./sceneComponent";
import { systemComponentOptions } from "./systemComponent";
import { textComponentOptions } from "./textComponent";
import { thirdPartEnumComponentOptions } from "./thirdPartComponent";

export const componentOption = {
  ...baseComponentOptions,
  ...textComponentOptions,
  ...mediaComponentOptions,
  ...iframeComponentOptions,
  ...extendsComponentOptions,
  ...sceneComponentOptions,
  ...systemComponentOptions,
  ...interactiveEnumComponentOptions,
  ...exhibitEnumComponentOptions,
  ...indicatorComponentOptions,
  ...thirdPartEnumComponentOptions
};
