<!-- 导航菜单 -->
<template>
  <div
    :class="{
      'ft-form-nav-menu': true,
      'component-bind-events': true,
      'has-bind': events?.length && isBuild.value,
      'has-encode': encodes?.length && isBuild.value
    }"
    :style="{ ...styleSizeName }"
  >
    <div
      ref="navmenu"
      :class="{
        'menu-container': true
      }"
      :style="containerStyle"
    >
      <el-menu
        v-if="isShow"
        ref="menuRef"
        :mode="option.type"
        :default-active="defaultActive"
        :background-color="option.backgroundColor"
        :text-color="option.textColor"
        :active-text-color="option.activeTextColor"
        :unique-opened="option.uniqueOpened"
        :menu-trigger="option.menuTrigger"
        :collapse-transition="option.collapseTransition"
        :style="textStyle"
        :class="[option.isHiddenArrow ? 'hidden-arrow' : '', !option.isOpenedLine ? 'hidden-line' : '']"
        :data-child="option.isChildStyle ? '1' : '0'"
        @open="handleOpen"
      >
        <template v-for="(item, index) in dataChart" :key="item.value || index">
          <el-sub-menu
            v-if="item.children && item.children.length"
            :index="item.value"
            :data-class="'1'"
            :teleported="false"
            @click="onSubMenu"
          >
            <template #title>
              <i
                v-if="!option.checkboxTabs"
                class="icon-image"
                :style="{
                  backgroundImage: `url(${setMinioUrl(item.image)})`
                }"
              />
              <template v-else>
                <template v-if="option.showParentPrefix">
                  <i
                    v-if="option.checkboxTabs.parentPrefix.isDataFirst"
                    class="icon-image"
                    :style="{
                      backgroundImage: `url(${setMinioUrl(item.image)})`,
                      ...iconImageStyle
                    }"
                  />
                  <i
                    class="icon-image"
                    v-else
                    :style="{
                      backgroundImage: `url(${setMinioUrl(option.checkboxTabs.parentPrefix.url)})`,
                      ...iconImageStyle
                    }"
                  />
                </template>
              </template>
              <!-- 多选且支持选中父元素 -->
              <el-checkbox
                v-model="item.isChecked"
                v-if="option?.checkboxTabs?.multiple && option?.checkboxTabs?.selectParent"
                @change="handleCheck(item)"
              />
              <span v-html="item.label" :data-translate="item.label" />
            </template>
            <ft-sub-menu
              :data="item.children"
              indexClass="2"
              :option="option"
              :suffixStyle="suffixStyle"
              :childSuffixIcon="childSuffixIcon"
              :childPrefixStyle="childPrefixStyle"
              @select="(info) => onChildClick(info)"
              @change="(info) => handleCheck(info)"
              :ref="`subMenu${index}`"
            />
          </el-sub-menu>
          <el-menu-item
            v-else
            :index="item.value"
            :disabled="item.disabled"
            :data-class="'1'"
            @click="onChildClick(item)"
          >
            <template #title>
              <i
                v-if="!option.checkboxTabs"
                class="icon-image"
                :style="{
                  backgroundImage: `url(${setMinioUrl(item.image)})`
                }"
              />
              <template v-else>
                <template v-if="option.showParentPrefix">
                  <i
                    v-if="option.checkboxTabs.parentPrefix.isDataFirst"
                    class="icon-image"
                    :style="{
                      backgroundImage: `url(${setMinioUrl(item.image)})`,
                      ...iconImageStyle
                    }"
                  />
                  <i
                    class="icon-image"
                    v-else
                    :style="{
                      backgroundImage: `url(${setMinioUrl(option.checkboxTabs.parentPrefix.url)})`,
                      ...iconImageStyle
                    }"
                  />
                </template>
              </template>
              <!-- 多选且支持选中父元素 -->
              <span v-html="item.label" :data-translate="item.label" />
            </template>
          </el-menu-item>
        </template>
      </el-menu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@material/minioUrl";
import type { ComponentType } from "@screenwright/types";

import FtSubMenu from "./subMenu.vue";
import { useNavMenu } from "./useNavMenu";

defineOptions({
  name: "formNavMenu"
});

// Props定义
const props = defineProps<{
  element: ComponentType;
}>();
const { styleSizeName, option, isBuild, encodes, events, dataChart } = useBaseData(props.element);

// 使用导航菜单hook
const {
  isShow,
  defaultActive,
  navmenu,
  menuRef,
  containerStyle,
  textStyle,
  iconImageStyle,
  childSuffixIcon,
  suffixStyle,
  childPrefixStyle,
  menuTextAlign,
  childrenMenuAlign,
  onSubMenu,
  onChildClick,
  handleOpen,
  handleCheck
} = useNavMenu(props.element, isBuild.value);
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();

.menu-container {
  height: 100%;
  overflow: auto;
  background-repeat: no-repeat;
  background-size: cover;
  --fontSize: v-bind("(option.fontSize || 16) + 'px'");
  --fontColor: v-bind("option.activeTextColor || '#ffffff'");
  --fontWeight: v-bind("option.fontWeight");
  --lineHeight: v-bind("option.lineHeight + 'px'");
  --linearGradient: v-bind(
    "option.backgroundRadius + 'deg, ' + option.backgroundColor1 + ', ' + option.backgroundColor2"
  );
  --linearGradient2: v-bind("option.childBgRadius + 'deg, ' + option.childBgColor1 + ', ' + option.childBgColor2");
  --borderRadius: v-bind(
    "option.radiusTop + 'px ' + option.radiusRight + 'px ' + option.radiusBottom + 'px ' + option.radiusLeft + 'px'"
  );
  --borderRadius2: v-bind(
    "option.childRadiusTop + 'px ' + option.childRadiusRight + 'px ' + option.childRadiusBottom + 'px ' + option.childRadiusLeft + 'px'"
  );
  --textAlign: v-bind(menuTextAlign);
  --childrenTextAlign: v-bind(childrenMenuAlign);
  --textSpace: v-bind("(option.textSpace || 0) + 'px'");
  --popupWidth: v-bind("(option.popupwidth || 200) + 'px'");
  --childFontColor: v-bind("option.childFontColor || '#737373'");
  --childTextAlign: v-bind("option.childTextAlign || 'left'");
  --childLetterSpacing: v-bind("(option.childLetterSpacing || 0) + 'px'");
  --childFontFamily: v-bind("option.childFontFamily || 'sans-serif'");
  --childFontWeight: v-bind("option.childFontWeight");
  --childFontStyle: v-bind("option.childFontStyle");
  --childLineColor1: v-bind("option.childLineColor1 || '#2a2e3f'");
  --childLineColor2: v-bind("option.childLineColor2 || '#1fc2ff'");
  --checkBoxInnerWidth: v-bind("(option.checkboxTabs.checkboxStyle.width || 16)+'px'");
  --checkBoxCheckWidth: v-bind(
    "(option.checkboxTabs.checkboxStyle.width || 16)/2-(option.checkboxTabs.checkboxStyle.width/16*5)+'px'"
  );
  --checkBoxCheckHeight: v-bind(
    "(option.checkboxTabs.checkboxStyle.height || 16)/2-(option.checkboxTabs.checkboxStyle.width/16*1)+'px'"
  );
  --checkBoxCheckBorderWidth: v-bind(
    "(option.checkboxTabs.checkboxStyle.width>=option.checkboxTabs.checkboxStyle.height?(option.checkboxTabs.checkboxStyle.width/10):(option.checkboxTabs.checkboxStyle.height/10))+'px'"
  );
  --checkBoxInnerHeight: v-bind("(option.checkboxTabs.checkboxStyle.height || 16)+'px'");
  --checkBoxInnerRadius: v-bind("(option.checkboxTabs.checkboxStyle.borderRadius || 0)+'px'");
  --checkBoxInnerBackgroundColor: v-bind("option.checkboxTabs.checkboxStyle.backgroundColor || '#642cff'");
  --checkBoxInnerBorderColor: v-bind("option.checkboxTabs.checkboxStyle.borderColor || '#642cff'");
  & > div {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  :deep(.el-menu.el-menu--horizontal) {
    .el-sub-menu,
    .el-menu--popup,
    .el-menu-item {
      min-width: var(--popupWidth);
      width: var(--popupWidth);
      // z-index: 1;
      // position: relative;
    }
  }

  :deep(.el-checkbox) {
    &.is-checked {
      .el-checkbox__inner {
        background: linear-gradient(
          180deg,
          var(--checkBoxInnerBackgroundColor) 0%,
          var(--checkBoxInnerBackgroundColor) 100%
        ) !important;
      }
    }
    .el-checkbox__inner {
      width: var(--checkBoxInnerWidth);
      height: var(--checkBoxInnerHeight);
      border-radius: var(--checkBoxInnerRadius);
      border-color: var(--checkBoxInnerBorderColor) !important;
      &:after {
        left: 50%;
        top: 50%;
        width: var(--checkBoxCheckWidth);
        height: var(--checkBoxCheckHeight);
        border-width: var(--checkBoxCheckBorderWidth);
        transform: translate(-50%, -50%) rotate(45deg);
      }
    }
  }
  :deep(.el-menu) {
    border-right: none;
    border-bottom: none;
    // text-align: var(--textAlign) !important;
    height: 100%;
    &.hidden-arrow .el-sub-menu__icon-arrow {
      display: none;
    }
    .el-sub-menu__title,
    .el-menu-item {
      height: var(--lineHeight);
      line-height: var(--lineHeight);
      font-size: var(--fontSize) !important;
      font-weight: var(--fontWeight);
      border-bottom: none;
      justify-content: var(--textAlign);
      align-items: center;
      // padding-right: 44px;
      //z-index: 1;
      //position: relative;
      &:hover,
      &.is-active {
        background: linear-gradient(var(--linearGradient)) !important;
        border-radius: var(--borderRadius);
        font-weight: 600;
      }
      .icon-image {
        display: inline-block;
        width: calc(var(--lineHeight) / 3);
        height: calc(var(--lineHeight) / 3);
        margin-right: 10px;
        background-size: 100% 100%;
        background-repeat: no-repeat;
      }
    }
    // 使用子级样式
    &[data-child="1"] .el-sub-menu {
      .el-sub-menu__title,
      .el-menu-item {
        &:hover,
        &.is-active {
          background: transparent !important;
        }
      }
      .el-menu-item {
        justify-content: var(--childTextAlign);
        color: var(--childFontColor) !important;
        text-align: var(--childTextAlign);
        letter-spacing: var(--childLetterSpacing);
        font-family: var(--childFontFamily);
        font-weight: var(--childFontWeight);
        font-style: var(--childFontStyle);
        &.is-active {
          color: var(--fontColor) !important;
        }
      }
      &.is-active .el-sub-menu__title {
        // background: linear-gradient(var(--linearGradient)) !important;
        border-radius: var(--borderRadius);
        font-weight: 600;
      }

      .el-menu-item::after {
        content: "";
        width: 3px;
        height: 100%;
        position: absolute;
        background-color: var(--childLineColor1);
        top: 0;
        left: 30px;
        z-index: 1;
      }
      .el-menu .el-menu-item.is-active {
        background: linear-gradient(var(--linearGradient2)) !important;
        border-radius: var(--borderRadius2);
        // &::after {
        //   content: "";
        //   width: 3px;
        //   height: 100%;
        //   position: absolute;
        //   top: 0;
        //   left: 30px;
        //   background: var(--childLineColor2);
        //   border-radius: var(--borderRadius2);
        //   z-index: 1;
        // }
      }
    }
    &.hidden-line[data-child="1"] .el-sub-menu {
      .el-menu-item::after {
        content: none !important;
      }
    }
    // 字体
    .el-sub-menu {
      &[data-class="1"] {
        & > .el-menu .el-menu-item {
          font-size: calc(var(--fontSize) - var(--textSpace)) !important;
        }
      }
      &[data-class="2"] {
        & > .el-sub-menu__title {
          font-size: calc(var(--fontSize) - var(--textSpace)) !important;
        }
        & > .el-menu .el-menu-item {
          font-size: calc(var(--fontSize) - var(--textSpace) - var(--textSpace)) !important;
        }
      }
      .el-sub-menu[data-class="3"] {
        & > .el-sub-menu__title {
          font-size: calc(var(--fontSize) - var(--textSpace) - var(--textSpace)) !important;
        }
        & > .el-menu .el-menu-item {
          font-size: calc(var(--fontSize) - var(--textSpace) - var(--textSpace) - var(--textSpace)) !important;
        }
      }
    }
  }
}
</style>
