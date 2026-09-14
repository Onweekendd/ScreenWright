<template>
  <div class="threeScene-iconList-config">
    <SwCollapseItem title="图标样式" open>
      <template #content>
        <!-- <el-form-item label="填充类型" :label-width="secondLabelWidth">
          <el-select v-model="iconOption.iconContentType" popper-class="sw-select-dropdown" @change="update">
            <el-option v-for="item in iconContent" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <template v-if="iconOption.iconContentType === 'text'">
          <el-form-item label="文本内容" title="文本内容" :label-width="secondLabelWidth">
            <SwInput v-model="iconOption.content" @change="update" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="内嵌图标" title="内嵌图标" :label-width="secondLabelWidth">
            <SwUpload v-model="iconOption.iconImg" @delete="update" @change="update" />
          </el-form-item>
          <el-form-item label="图标尺寸" :label-width="secondLabelWidth">
            <SwInputNumber @change="update" v-model="iconOption.innerIconSize" />
          </el-form-item>
        </template> -->

        <el-form-item label="文本偏移" :label-width="secondLabelWidth">
          <div class="multi-input">
            <SwInputNumber v-model="iconOption.offsetX" @change="update" />
            <span class="label">X</span>
            <SwInputNumber v-model="iconOption.offsetY" @change="update" />
            <span class="label">Y</span>
          </div>
        </el-form-item>
        <el-form-item label="原点偏移" :label-width="secondLabelWidth">
          <div class="multi-input">
            <SwInputNumber v-model="iconOption.originX" @change="update" />
            <span class="label">X</span>
            <SwInputNumber v-model="iconOption.originY" @change="update" />
            <span class="label">Y</span>
          </div>
        </el-form-item>
        <SwCoordinateTabs v-model="tabsActive" :option="coordinateOption" />
        <template v-if="tabsActive !== 'defaultObj'">
          <el-form-item label="启用" :label-width="secondLabelWidth">
            <el-checkbox v-model="iconOption[`${currentState}Show`]" @change="update" />
          </el-form-item>
          <el-form-item label="文本交互" :label-width="secondLabelWidth">
            <el-checkbox v-model="iconOption[`${currentState}Mode`].textFollow" @change="update" />
          </el-form-item>
          <el-form-item v-if="iconOption[`${currentState}Show`]" label="缩放系数" :label-width="secondLabelWidth">
            <SwInputNumber v-model="iconOption[`${currentState}Mode`].iconScale" :controls="true" @change="update" />
          </el-form-item>
          <el-form-item label="图标" :label-width="secondLabelWidth">
            <SwUpload v-model="iconOption[`${currentState}Mode`].highLightUrl" @delete="update" @change="update" />
          </el-form-item>
        </template>
        <el-form-item label="图标" :label-width="secondLabelWidth" v-else>
          <SwUpload v-model="iconOption.url" @delete="update" @change="update" />
        </el-form-item>
        <template v-if="iconOption.iconContentType === 'text'">
          <template v-if="tabsActive === 'defaultObj'">
            <el-form-item label="文本样式" :label-width="secondLabelWidth">
              <configTextStyle v-model="input" @change="handleConfigTextChange" />
            </el-form-item>
            <el-form-item label="文字背景" :label-width="secondLabelWidth">
              <el-select v-model="iconOption.textFillType" popper-class="sw-select-dropdown" @change="update">
                <el-option label="颜色" value="color" />
                <el-option label="图片" value="picture" />
              </el-select>
            </el-form-item>
            <el-form-item label="背景颜色" :label-width="secondLabelWidth" v-if="iconOption.textFillType === 'color'">
              <SwSingleColorPicker v-model="iconOption.textBackground" @change="update" />
            </el-form-item>
            <el-form-item label="背景图片" :label-width="secondLabelWidth" v-else>
              <SwUpload v-model="iconOption.textBackgroundUrl" @delete="update" @change="update" />
            </el-form-item>
          </template>
          <template v-else>
            <el-form-item label="文本样式" :label-width="secondLabelWidth">
              <configTextStyle v-model="currentStateModeInput" @change="currentStateModeChange" />
            </el-form-item>
            <el-form-item label="文字背景" :label-width="secondLabelWidth">
              <el-select
                v-model="iconOption[`${currentState}Mode`].textFillType"
                popper-class="sw-select-dropdown"
                @change="update"
              >
                <el-option label="颜色" value="color" />
                <el-option label="图片" value="picture" />
              </el-select>
            </el-form-item>
            <el-form-item
              label="背景颜色"
              :label-width="secondLabelWidth"
              v-if="iconOption[`${currentState}Mode`].textFillType === 'color'"
            >
              <SwSingleColorPicker
                v-model="iconOption[`${currentState}Mode`].textBackground"
                :opacityShow="false"
                @change="update"
              />
            </el-form-item>
            <el-form-item label="背景图片" :label-width="secondLabelWidth" v-else>
              <SwUpload
                v-model="iconOption[`${currentState}Mode`].textBackgroundUrl"
                @delete="update"
                @change="update"
              />
            </el-form-item>
            <template
              v-if="
                iconOption[`${currentState}Mode`].textFollow &&
                iconOption[`${currentState}Mode`].textFillType === 'picture'
              "
            >
              <el-form-item label="文字动画" :label-width="secondLabelWidth">
                <el-select
                  v-model="iconOption[`${currentState}Mode`].textAnimation"
                  popper-class="sw-select-dropdown"
                  @change="update"
                >
                  <el-option label="无" value="none" />
                  <el-option label="轮播" value="carousel" />
                </el-select>
              </el-form-item>
              <el-form-item
                label="动画时间"
                :label-width="secondLabelWidth"
                v-if="iconOption[`${currentState}Mode`].textAnimation !== 'none'"
              >
                <SwInputNumber
                  v-model="iconOption[`${currentState}Mode`].textAnimationInterval"
                  :min="1000"
                  :step="1000"
                  unit="ms"
                  @change="update"
                />
              </el-form-item>
            </template>
          </template>
        </template>
        <template v-else>
          <template v-if="tabsActive === 'defaultObj'">
            <el-form-item label="图标颜色" :label-width="secondLabelWidth">
              <SwSingleColorPicker v-model="iconOption.innerIconColor" :opacityShow="false" />
            </el-form-item>
          </template>
          <template v-else>
            <el-form-item label="图标颜色" :label-width="secondLabelWidth">
              <SwSingleColorPicker v-model="iconOption[`${currentState}Mode`].innerIconColor" :opacityShow="false" />
            </el-form-item>
          </template>
        </template>
      </template>
    </SwCollapseItem>
    <!-- <SwCollapseItem title="视频样式" v-if="type === 'iconList'">
      <template #content>
        <el-form-item label="背景图片" :label-width="secondLabelWidth">
          <SwUpload v-model="proxyAction.backgroundImage" @delete="update" @change="update" />
        </el-form-item>
        <el-form-item label="背景尺寸" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between">
            <SwInputNumber v-model="proxyAction.width" unit="W" @change="update" />
            <SwInputNumber v-model="proxyAction.height" unit="H" @change="update" />
          </div>
        </el-form-item>
        <el-form-item label="背景边距" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between">
            <SwInputNumber v-model="proxyAction.paddingTop" unit="px" @change="update" />
            <SwInputNumber v-model="proxyAction.paddingX" unit="px" @change="update" />
            <SwInputNumber v-model="proxyAction.paddingBottom" unit="px" @change="update" />
          </div>
        </el-form-item>
        <el-form-item label="横向偏移" :label-width="secondLabelWidth">
          <SwInputNumber v-model="iconOption.boxOffsetX" @change="update" />
        </el-form-item>
        <el-form-item label="纵向偏移" :label-width="secondLabelWidth">
          <SwInputNumber v-model="iconOption.boxOffsetY" @change="update" />
        </el-form-item>
        <SwCollapseItem
          title="关闭图标"
          :label-width="secondLabelWidth"
          v-model="proxyAction.closeShow"
          @change="update"
          showIcon
        >
          <template #content>
            <el-form-item label="样式" :label-width="thirdLabelWidth">
              <SwUpload v-model="proxyAction.closeIcon" @delete="update" @change="update" />
            </el-form-item>
            <el-form-item label="尺寸" :label-width="thirdLabelWidth">
              <div class="flex flex-justify-between">
                <SwInputNumber v-model="proxyAction.widthIcon" unit="W" @change="update" />
                <SwInputNumber v-model="proxyAction.heightIcon" unit="H" @change="update" />
              </div>
            </el-form-item>
            <el-form-item label="偏移" :label-width="thirdLabelWidth">
              <div class="flex flex-justify-between">
                <SwInputNumber v-model="proxyAction.topIcon" unit="px" bottomLabel="上" @change="update" />
                <SwInputNumber v-model="proxyAction.rightIcon" unit="px" bottomLabel="右" @change="update" />
              </div>
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem> -->
    <SwCollapseItem title="状态管理" open>
      <template #icon>
        <Icon type="CirclePlus" @click="handleStatusChange('add')" />
        <Icon type="Delete" @click="handleStatusChange('delete')" />
      </template>
      <template #content>
        <template v-if="iconOption.statusNameList.length > 0">
          <ScreenwrightSeriesTabs v-model="statusTabs" :tabs="iconOption.statusNameList" />
          <div v-for="(item, index) in iconOption.statusList" :key="index">
            <div v-if="`状态${Number(index) + 1}` === statusTabs">
              <el-form-item label="状态值" :label-width="secondLabelWidth">
                <SwInput v-model="item.name" @change="update" />
              </el-form-item>
              <el-form-item label="图标" :label-width="secondLabelWidth">
                <SwUpload v-model="item.url" @delete="update" @change="update" />
              </el-form-item>
              <el-form-item label="缩放系数" :label-width="secondLabelWidth">
                <SwInputNumber v-model="item.iconScale" :controls="true" @change="update" />
              </el-form-item>
              <template v-if="iconOption.iconContentType === 'text'">
                <el-form-item label="文本样式" :label-width="secondLabelWidth">
                  <configTextStyle v-model="currentStatusInput" @change="currentStatusChange" />
                </el-form-item>
                <el-form-item label="填充方式" :label-width="secondLabelWidth">
                  <el-select
                    :model-value="getTextBgFillType(item.textBackground)"
                    popper-class="sw-select-dropdown"
                    @update:model-value="(val) => setTextBgFillType(item, val)"
                    @change="update"
                  >
                    <el-option label="颜色" value="color" />
                    <el-option label="图片" value="picture" />
                  </el-select>
                </el-form-item>
                <el-form-item
                  label="背景颜色"
                  :label-width="secondLabelWidth"
                  v-if="getTextBgFillType(item.textBackground) === 'color'"
                >
                  <SwSingleColorPicker
                    :model-value="getTextBgColor(item.textBackground)"
                    @update:model-value="(val) => setTextBgColor(item, val)"
                    @change="update"
                  />
                </el-form-item>
                <el-form-item label="背景图片" :label-width="secondLabelWidth" v-else>
                  <SwUpload
                    :model-value="getTextBgUrl(item.textBackground)"
                    @update:model-value="(val) => setTextBgUrl(item, val)"
                    @delete="update"
                    @change="update"
                  />
                </el-form-item>
                <template v-if="getTextBgFillType(item.textBackground) === 'picture'">
                  <el-form-item label="文字动画" :label-width="secondLabelWidth">
                    <el-select v-model="item.textAnimation" popper-class="sw-select-dropdown" @change="update">
                      <el-option label="无" value="none" />
                      <el-option label="轮播" value="carousel" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="动画时间" :label-width="secondLabelWidth" v-if="item.textAnimation !== 'none'">
                    <SwInputNumber
                      v-model="item.textAnimationInterval"
                      :min="100"
                      :step="100"
                      unit="ms"
                      @change="update"
                    />
                  </el-form-item>
                </template>
              </template>
              <template v-else>
                <el-form-item label="图标颜色" :label-width="secondLabelWidth">
                  <SwSingleColorPicker v-model="item.innerIconColor" @change="update" />
                </el-form-item>
              </template>
            </div>
          </div>
        </template>
        <el-form-item label="列表为空" :label-width="secondLabelWidth" v-else />
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

import { isSupportedFlv, isSupportedHls } from "@screenwright/material/media";

import { cloneDeep } from "@/components/ScreenwrightSceneComponent/utils";
import ScreenwrightSeriesTabs from "@/components/ScreenwrightSeriesTabs/index.vue";
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwCoordinateTabs from "@/components/SwCoordinateTabs/index.vue";
import SwInput from "@/components/SwInput/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import SwUpload from "@/components/SwUpload/index.vue";
import Icon from "@/components/Icon/index.vue";
import { setMinioUrl } from "@/utils/config";
import {
  customAction,
  defaultStatusOption
} from "@/views/build/components/buildConfig/attrsRender/childrenManager/threeMapChildConfig";
import { useThreeSceneChildComponent } from "@/views/build/components/buildConfig/attrsRender/childrenManager/useThreeSceneChildComponent";
import configTextStyle from "@/views/build/components/buildConfig/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@/views/build/components/buildConfig/components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "@/views/build/components/buildConfig/constants/index";

const { currentChildrenItem, iconOption, update } = useThreeSceneChildComponent();

type TextBgFillType = "color" | "picture";
type TextBgValue = string | { type?: TextBgFillType; color?: string; url?: string } | undefined | null;

const normalizeTextBg = (val: TextBgValue): { type: TextBgFillType; color: string; url: string } => {
  if (typeof val === "string") {
    return { type: "color", color: val, url: "" };
  }
  const type = val?.type === "picture" ? "picture" : "color";
  const color = typeof val?.color === "string" ? val.color : "transparent";
  const url = typeof val?.url === "string" ? val.url : "";
  if (type === "color" && url && color === "transparent") {
    return { type: "picture", color, url };
  }
  return { type, color, url };
};

const getTextBgFillType = (val: TextBgValue): TextBgFillType => normalizeTextBg(val).type;
const getTextBgColor = (val: TextBgValue): string => normalizeTextBg(val).color;
const getTextBgUrl = (val: TextBgValue): string => normalizeTextBg(val).url;

const setTextBgFillType = (target: any, fillType: TextBgFillType) => {
  const cur = normalizeTextBg(target?.textBackground as TextBgValue);
  if (fillType === "color") {
    target.textBackground = cur.color || "transparent";
  } else {
    target.textBackground = { type: "picture", url: cur.url || "", color: cur.color || "transparent" };
  }
};
const setTextBgColor = (target: any, color: string) => {
  const cur = normalizeTextBg(target?.textBackground as TextBgValue);
  if (cur.type === "picture") {
    target.textBackground = { type: "picture", url: cur.url || "", color: color || "transparent" };
  } else {
    target.textBackground = color || "transparent";
  }
};
const setTextBgUrl = (target: any, url: string) => {
  const cur = normalizeTextBg(target?.textBackground as TextBgValue);
  target.textBackground = { type: "picture", url: url || "", color: cur.color || "transparent" };
};

// const defaultTextBgFillType = computed<TextBgFillType>({
//   get: () => getTextBgFillType(iconOption.value.textBackground as TextBgValue),
//   set: (val) => setTextBgFillType(iconOption.value, val)
// });
// const defaultTextBgColor = computed<string>({
//   get: () => getTextBgColor(iconOption.value.textBackground as TextBgValue),
//   set: (val) => setTextBgColor(iconOption.value, val)
// });
// const defaultTextBgUrl = computed<string>({
//   get: () => getTextBgUrl(iconOption.value.textBackground as TextBgValue),
//   set: (val) => setTextBgUrl(iconOption.value, val)
// });

// 状态管理
const statusTabs = ref("状态1");
const handleStatusChange = (val: string) => {
  const len = iconOption.value.statusNameList.length;
  const curSelectedIndex = iconOption.value.statusNameList.findIndex((item: string) => item === statusTabs.value);
  if (val === "add") {
    iconOption.value.statusNameList.push(`状态${len + 1}`);
    if (iconOption.value.statusList.length === 0) {
      iconOption.value.statusList.push(cloneDeep(defaultStatusOption));
    } else {
      iconOption.value.statusList.push(cloneDeep(iconOption.value.statusList[len - 1]));
    }
    statusTabs.value = iconOption.value.statusNameList[iconOption.value.statusNameList.length - 1];
  } else if (val === "delete" && len > 0) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    iconOption.value.statusList.splice(curSelectedIndex, 1)[0];
    iconOption.value.statusNameList = iconOption.value.statusList.map((item: any, index: number) => `状态${index + 1}`);
    statusTabs.value =
      iconOption.value.statusNameList[
        curSelectedIndex === iconOption.value.statusNameList.length ? curSelectedIndex - 1 : curSelectedIndex
      ];
  }
};
const currentStatusAttrs = computed(() => {
  return `options.statusList[${Number(statusTabs.value.slice(-1)) - 1}]`;
});
const {
  input: currentStatusInput,
  handleConfigTextChange: currentStatusChange,
  getInitValue: currentStatusSetAttrs
} = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "color",
  attrs: currentStatusAttrs.value
});
watch(
  () => currentStatusAttrs.value,
  (val) => {
    currentStatusSetAttrs(val);
  }
);

const tabsActive = ref("defaultObj");
// watch(
//   () => tabsActive.value,
//   () => {
//     // const pathAttrs = tabsActive.value
//     // getInitValue(pathAttrs)
//   }
// )
const coordinateOption = computed(() => {
  const column = [
    {
      label: "默认",
      value: "defaultObj"
    },
    {
      label: "选中",
      value: "activeObj"
    },
    {
      label: "悬停",
      value: "hoverObj"
    }
  ];
  const { activeMode, hoverMode } = iconOption.value;
  if (activeMode && hoverMode) {
    return column;
  }
  return column.slice(0, 1);
});

const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "color",
  attrs: "options"
});

// 默认、选中、悬停状态
const currentState = computed(() => {
  switch (tabsActive.value) {
    case "defaultObj":
      return "custom";
    case "activeObj":
      return "active";
    default:
      return "hover";
  }
});
const currentStateModeAttrs = computed(() => {
  return `options.${currentState.value === "custom" ? "active" : currentState.value}Mode`;
});

// const modeTarget = computed<any>(() => {
//   if (currentState.value === "active" || currentState.value === "hover") {
//     return (iconOption.value as any)[`${currentState.value}Mode`];
//   }
//   return null;
// });
// const modeTextBgFillType = computed<TextBgFillType>({
//   get: () => getTextBgFillType(modeTarget.value?.textBackground as TextBgValue),
//   set: (val) => {
//     if (!modeTarget.value) return;
//     setTextBgFillType(modeTarget.value, val);
//   }
// });
// const modeTextBgColor = computed<string>({
//   get: () => getTextBgColor(modeTarget.value?.textBackground as TextBgValue),
//   set: (val) => {
//     if (!modeTarget.value) return;
//     setTextBgColor(modeTarget.value, val);
//   }
// });
// const modeTextBgUrl = computed<string>({
//   get: () => getTextBgUrl(modeTarget.value?.textBackground as TextBgValue),
//   set: (val) => {
//     if (!modeTarget.value) return;
//     setTextBgUrl(modeTarget.value, val);
//   }
// });
const {
  input: currentStateModeInput,
  handleConfigTextChange: currentStateModeChange,
  getInitValue: currentStateModeSetAttrs
} = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "color",
  attrs: currentStateModeAttrs.value
});
watch(
  () => currentStateModeAttrs.value,
  (val) => {
    currentStateModeSetAttrs(val);
  }
);

const mapBoxObj = ref<any>(null);
const activeName = ref("first");
const videoActiveName = ref("first");
const isEdit = ref(false);

const proxyAction = ref<any>({});
const initProxy = () => {
  const { interAction } = iconOption.value;
  mapBoxObj.value = null;
  activeName.value = "first";
  videoActiveName.value = "first";
  isEdit.value = false;
  // if (!interAction && action !== 'mapBox') return;
  if (JSON.stringify(interAction) !== "{}") {
    mapBoxObj.value = document.getElementsByClassName(`map-box-${iconOption.value.index}`)[0];
  } else {
    iconOption.value.interAction = cloneDeep(customAction);
  }
  if (iconOption.value.interAction) {
    proxyAction.value = new Proxy(iconOption.value.interAction, {
      set: (target, prop, value) => {
        target[prop] = value;
        console.log(prop, value);
        return setDomProperty(prop, value);
      }
    });
  }
};

const isBoxMode = computed(() => {
  const { mapBoxShow, action } = iconOption.value;
  return action === "mapBox" && mapBoxShow && mapBoxObj.value;
});
// 设置弹窗元素显隐
const setElementVisible = (type: any, val: any) => {
  if (!isBoxMode.value) {
    return;
  }
  mapBoxObj.value.children[type === "closeShow" ? 0 : 1].style.display = val ? "unset" : "none";
};

// 设置弹窗样式属性
const setDomProperty = (prop: any, value: any) => {
  const dom = mapBoxObj;
  if (iconOption.value.action === "mapBox") {
    iconOption.value.interAction[prop] = value;
    if (dom.value) {
      const option = iconOption.value.interAction;
      const [close, video, tips] = dom.value.children;

      switch (prop) {
        case "src":
        case "link": {
          video[prop] = setMinioUrl(value);
          const videoFun: any = {
            flv: isSupportedFlv,
            m3u8: isSupportedHls
          };
          ["flv", "m3u8"].forEach((type) => {
            if (option.source === "link" && value.includes(`.${type}`)) {
              videoFun[type](setMinioUrl(value), tips, video);
            }
          });
          return true;
        }
        case "controls":
        case "autoplay":
        case "loop":
        case "muted":
          video[prop] = value ? prop : "";
          return true;
        case "width":
        case "height":
        case "backgroundImage":
          dom.value.style[prop] = prop === "backgroundImage" ? `url(${setMinioUrl(value)})` : `${value}px`;
          return true;
        case "widthIcon":
        case "heightIcon":
        case "topIcon":
        case "rightIcon":
          close.style[`${prop.split("Icon")[0]}`] = `${value}px`;
          return true;
        case "closeShow":
        case "videoBoxShow":
          setElementVisible(prop, value);
          return true;
        default:
          break;
      }

      dom.value.style.lineHeight = `${option.height}px`;
      dom.value.style.padding = `${option.paddingTop}px ${option.paddingX}px ${option.paddingBottom}px ${option.paddingX}px`;

      video["width"] = option.width - option.paddingX * 2;
      video["height"] = option.height - option.paddingTop - option.paddingBottom;
      video["style"]["mix-blend-mode"] = option.mixBlendMode || "normal";
    }
  }
  return true;
};

onMounted(() => {
  nextTick(() => {
    if (!currentChildrenItem.value.option.brushType) {
      initProxy();
    }
  });
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.threeScene-iconList-config {
  padding: 0 16px;
}
.multi-input {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  :deep(.sw-input-number) {
    flex: 1;
  }

  .label {
    color: rgba(255, 255, 255, 0.45);
    font-size: 12px;
    white-space: nowrap;
  }

  .lock-icon {
    width: 24px;
    height: 24px;
    color: rgba(255, 255, 255, 0.45);
    cursor: pointer;

    &.locked {
      color: var(--sw-theme-color);
    }
  }
}
</style>
