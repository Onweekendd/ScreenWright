<template>
  <div
    :class="{
      'ft-iframe': true,
      ...componentClasses
    }"
    :style="styleSizeName"
    ref="ftiframeRef"
    @click="handleIframeClick"
  >
    <template v-if="!option.isQuote">
      <!-- 关闭按钮 -->
      <Icon
        class="closeBtn"
        type="close"
        v-if="showClose && !option.closeBtnType"
        @click="handleBtnClick"
        :style="closeStyle"
      />

      <img
        class="closeBtn"
        v-if="showClose && option.closeBtnType === 'image' && option.closeImage"
        :src="setMinioUrl(option.closeImage)"
        @click="handleBtnClick"
        :style="closeStyle"
      />
      <!-- iframe -->
      <iframe
        v-if="!isUpdate"
        :src="dataChartItem.value || ''"
        draggable="false"
        ref="iframeRef"
        :style="iframeStyle"
        :frameborder="frameborder"
        :scrolling="scrolling"
        :sandbox="sandbox"
        @load="onIframeLoad"
        @error="onIframeLoad"
      />
    </template>
    <template v-else>
      <div :class="{ iframeWrapper: true, iframeWrapperMask: isBuild.value }">
        <div class="iframeContent" ref="iframeContent" :style="contentStyle">
          <div class="iframeContain" :style="containStyle">
            <template v-if="option.quoteInfo && option.quoteInfo.detail">
              <template v-for="(item, index) in data" :key="item.id">
                <edit-group
                  :disabled="true"
                  v-if="item.children && item.children.length > 0"
                  :groupData="item"
                  :groupIndex="index"
                  :isBuild="true"
                />

                <EditShapeBox
                  v-else
                  :events-icon-class="eventIconClass(item)"
                  :disabled="true"
                  :style="{
                    ...pointerEventStyle(item, isBuild.value),
                    ...customPositionStyle(item, true)
                  }"
                  :data-id="item.id"
                  :width="item.component.width"
                  :height="item.component.height"
                  :left="item.left"
                  :top="item.top"
                  :id="`${item.id}`"
                  :isLock="item.isLock"
                  :display="item.display"
                  :prop="item.component.prop"
                  :unitPavenType="item.unitPavenType"
                  :enterActiveAnimation="item.loadAnimation"
                >
                  <component
                    :is="renderComponent(item.component.prop)"
                    :element="item"
                    v-bind="item.props"
                    class="es-component"
                    :class="{ isHidden: item.width === 0 && item.height === 0 }"
                  />
                </EditShapeBox>
              </template>
            </template>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";
import { setMinioUrl } from "@/utils/config";
import { renderComponent } from "@/views/build/components/buildRender/core/utils";
import EditShapeBox from "@/views/build/components/buildRender/EditShapeBox.vue";
import EditGroup from "@/views/build/components/buildRender/Group.vue";
// import Group from "@/views/build/components/buildRender/Group.vue"
import type { ComponentType, mediaEnum } from "@/views/build/components/buildRender/type";
import { customPositionStyle, eventIconClass, pointerEventStyle } from "@/views/build/components/buildRender/utils";

import type { FTIframeOptions } from "./type";
import { useIframe } from "./useIframe";

const props = defineProps<{ element: ComponentType<mediaEnum.FtIframe, FTIframeOptions> }>();

defineOptions({
  name: "ftIframe"
});

// 使用提取的iframe hook
const {
  componentClasses,
  option,
  isBuild,
  isUpdate,
  dataChartItem,
  styleSizeName,
  iframeStyle,
  showClose,
  frameborder,
  scrolling,
  sandbox,
  closeStyle,
  containStyle,
  contentStyle,
  data,
  handleIframeClick,
  handleBtnClick,
  onIframeLoad
} = useIframe(props);
</script>

<style lang="scss" scoped>
.ft-iframe {
  position: relative;
  overflow: hidden;

  .closeBtn {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 999;
    cursor: pointer;
    color: black;
  }

  iframe,
  .iframeWrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .iframeWrapperMask .iframeContain dragBox {
    pointer-events: none !important;
    & > div,
    .ft-panel {
      pointer-events: none !important;
    }
  }
}
</style>
