<template>
  <div class="ft-slidecard-v1-global" v-if="selectTargetData[0]">
    <SwCollapseItem title="图片管理">
      <template #content>
        <el-form-item label="图片列表" :label-width="secondLabelWidth">
          <image-preview-dialog :value="selectTargetData[0].data" @update:value="handleImageChange" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="基础配置">
      <template #content>
        <el-form-item label="显示数量" :label-width="secondLabelWidth">
          <SwInputNumber @change="update" v-model="selectTargetData[0].option.maxDisplay" :min="1" controls />
        </el-form-item>
        <el-form-item label="透视距离" :label-width="secondLabelWidth">
          <SwInputNumber @change="update" v-model="selectTargetData[0].option.perspectiveDistance" :min="1" controls />
        </el-form-item>
        <el-form-item label="自动播放" :label-width="secondLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.autoPlay" />
        </el-form-item>

        <template v-if="selectTargetData[0].option.autoPlay">
          <el-form-item label="播放间隔" :label-width="secondLabelWidth">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.autoPlayInterval"
              :min="100"
              controls
              unit="ms"
            />
          </el-form-item>
          <el-form-item label="播放方向" :label-width="secondLabelWidth">
            <el-select
              @change="update"
              v-model="selectTargetData[0].option.autoPlayDirection"
              popper-class="sw-select-dropdown"
            >
              <el-option label="向上" value="up" />
              <el-option label="向下" value="down" />
              <el-option label="无" value="none" />
            </el-select>
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>

    <SwCollapseItem title="图片设置" v-if="selectTargetData[0].option[attrs]">
      <template #content>
        <div class="image-setting-tabs">
          <div class="tab-header">
            <div class="tab-item" :class="{ active: imageSettingTab === 'active' }" @click="imageSettingTab = 'active'">
              激活状态
            </div>
            <div
              class="tab-item"
              :class="{ active: imageSettingTab === 'default' }"
              @click="imageSettingTab = 'default'"
            >
              默认状态
            </div>
          </div>
        </div>
        <div class="tab-content">
          <el-form-item label="填充方式" :label-width="secondLabelWidth">
            <el-select
              style="width: 100%"
              popper-class="sw-select-dropdown"
              v-model="selectTargetData[0].option[attrs].fitType"
              @change="update"
            >
              <el-option v-for="item in objectFit" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <el-form-item label="图片尺寸" :label-width="secondLabelWidth">
            <div class="flex flex-justify-between" style="width: 100%">
              <SwInputNumber
                v-model="selectTargetData[0].option[attrs].width"
                :min="0"
                bottomLabel="宽"
                unit="px"
                @change="update"
                width="100"
              />
              <SwInputNumber
                v-model="selectTargetData[0].option.activeImageSetting.height"
                :min="0"
                bottomLabel="高"
                unit="px"
                width="100"
                @change="update"
              />
            </div>
          </el-form-item>

          <div v-show="imageSettingTab === 'active'" class="tab-content-active">
            <el-form-item label="预览状态" :label-width="secondLabelWidth">
              <div class="flex flex-justify-between" style="width: 100%">
                <SwInputNumber
                  v-model="selectTargetData[0].option.activeImageSetting.previewWidth"
                  :min="0"
                  bottomLabel="预览宽"
                  @change="update"
                  unit="px"
                  width="100"
                />
                <SwInputNumber
                  v-model="selectTargetData[0].option.activeImageSetting.previewHeight"
                  :min="0"
                  bottomLabel="预览高"
                  @change="update"
                  unit="px"
                  width="100"
                />
              </div>
            </el-form-item>

            <el-form-item label="预览时间" :label-width="secondLabelWidth">
              <SwInputNumber
                v-model="selectTargetData[0].option.activeImageSetting.previewDuration"
                :min="0"
                controls
                :placeholder="'0表示不自动退出'"
                bottomLabel="持续时间"
                @change="update"
                unit="ms"
              />
            </el-form-item>
          </div>
          <div v-show="imageSettingTab === 'default'" class="tab-content-default">
            <el-form-item label="旋转角度" :label-width="secondLabelWidth">
              <SwInputNumber
                v-model="selectTargetData[0].option.defaultImageSetting.rotate"
                :min="0"
                :max="360"
                controls
                unit="°"
                @change="update"
              />
            </el-form-item>

            <el-form-item label="图片间隔" :label-width="secondLabelWidth">
              <SwInputNumber
                @change="update"
                v-model="selectTargetData[0].option.defaultImageSetting.gap"
                :min="0"
                controls
                unit="°"
              />
            </el-form-item>

            <el-form-item label="深度间隔" :label-width="secondLabelWidth">
              <SwInputNumber
                @change="update"
                v-model="selectTargetData[0].option.defaultImageSetting.gapZ"
                :min="0"
                controls
                unit="°"
              />
            </el-form-item>
          </div>
        </div>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { objectFit } from "../../../media";
import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import imagePreviewDialog from "../components/imagePreviewDialog.vue";
import type { ImageItem } from "../types";

const { selectTargetData, update } = useUpdateInstance();

const imageSettingTab = ref("active");
const attrs = computed(() => {
  return imageSettingTab.value === "active" ? "activeImageSetting" : "defaultImageSetting";
});

/**
 * 处理图片变化
 */
const handleImageChange = (data: ImageItem[]) => {
  console.log("图片变化:", data);
  // 更新组件数据
  selectTargetData.value[0].data = data;

  // 调用API更新数据
  update();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
.image-setting-tabs {
  .tab-header {
    display: flex;
    margin-bottom: 16px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 2px;
    padding: 2px;

    .tab-item {
      flex: 1;
      text-align: center;
      padding: 6px 0;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.85);
      transition: all 0.3s;
      border-radius: 2px;

      &.active {
        background: #7134f0;
        color: #fff;
      }

      &:hover:not(.active) {
        color: #fff;
      }
    }
  }

  .tab-content {
    padding: 0 2px;
  }

  .flex {
    display: flex;
    gap: 8px;
  }
}
</style>
