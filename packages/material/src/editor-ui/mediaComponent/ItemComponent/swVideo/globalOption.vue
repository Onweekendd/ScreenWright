<template>
  <div class="flex flex-wrap">
    <el-form-item :label-width="firstLabelWidth">
      <template #label>
        <span
          >鼠标事件
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p>不开启表示鼠标点击等事件能穿透该组件，此时若设置控制条开启，鼠标悬浮上去是没有效果的</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <el-checkbox v-model="selectTargetData[0].option.pointerEvents" @change="update" />
    </el-form-item>
    <el-form-item label="非预览时播放" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.isBuildPlay" @change="update" />
    </el-form-item>
  </div>

  <StatusSelector label="视频" :label-width="firstLabelWidth" :properties="['video']">
    <sw-upload
      v-model="videoValue"
      :fileType="FileType.video"
      :multiple="false"
      :showFileList="false"
      @change="onFileChange"
    />
  </StatusSelector>

  <el-form-item
    label="封面"
    :label-width="firstLabelWidth"
    v-if="selectTargetData[0].data && selectTargetData[0].data.length > 0"
  >
    <sw-upload
      v-model="selectTargetData[0].data[0].cover"
      :multiple="false"
      :showFileList="false"
      @change="update"
      @delete="update"
    />
  </el-form-item>
  <el-form-item label="混合模式" :label-width="firstLabelWidth">
    <el-select
      style="width: 100%"
      popper-class="sw-select-dropdown"
      v-model="selectTargetData[0].option.mixBlendMode"
      @change="update"
    >
      <el-option v-for="item in mixBlendMode" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
  </el-form-item>

  <StatusSelector label="透明度" :label-width="firstLabelWidth" :properties="['opacity']">
    <SwSlider v-model="opacityValue" :min="0" :max="1" :step="0.1" />
  </StatusSelector>

  <SwCollapseItem title="背景">
    <template #content>
      <el-form-item label="填充方式" :label-width="secondLabelWidth">
        <el-select
          style="width: 100%"
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.backgroundType"
          @change="update"
        >
          <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        label="颜色"
        v-if="selectTargetData[0].option.backgroundType == 'color'"
        :label-width="secondLabelWidth"
      >
        <sw-single-color-picker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
      </el-form-item>
      <el-form-item
        label="类型"
        v-if="selectTargetData[0].option.backgroundType == 'custom'"
        :label-width="secondLabelWidth"
      >
        <el-select
          style="width: 100%"
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.backgroundImageType"
          @change="update"
        >
          <el-option v-for="item in backgroundImageType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        label="图片"
        v-if="selectTargetData[0].option.backgroundType == 'custom'"
        :label-width="secondLabelWidth"
      >
        <sw-upload
          v-model="selectTargetData[0].option.backgroundImage"
          :multiple="false"
          :showFileList="false"
          @change="update"
          @delete="update"
        />
      </el-form-item>
    </template>
  </SwCollapseItem>
  <SwCollapseItem title="播放控制">
    <template #content>
      <div class="flex flex-center-between flex-wrap">
        <el-form-item label="控制条" style="width: 50%" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.controler" @change="update" />
        </el-form-item>
        <el-form-item label="静音" style="width: 50%" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.muted" @change="update" />
        </el-form-item>

        <el-form-item label="自动播放" style="width: 50%" :label-width="secondLabelWidth">
          <template #label>
            <span
              >自动播放
              <el-tooltip class="item" effect="dark" placement="right">
                <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
                <template #content>
                  <p>自动播放时延时播放不生效</p>
                </template>
              </el-tooltip>
            </span>
          </template>
          <el-checkbox v-model="selectTargetData[0].option.autoPlay" @change="update" />
        </el-form-item>
        <el-form-item label="延迟播放" style="width: 50%" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.delayPlayTime"
            unit="s"
            :min="0"
            :controls="false"
            :disabled="selectTargetData[0].option.autoPlay"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="循环播放" style="width: 50%" :label-width="secondLabelWidth">
          <template #label>
            <span
              >循环播放
              <el-tooltip class="item" effect="dark" placement="right">
                <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
                <template #content>
                  <p>循环播放时自动隐藏不生效</p>
                </template>
              </el-tooltip>
            </span>
          </template>
          <el-checkbox v-model="selectTargetData[0].option.loopPlay" @change="update" />
        </el-form-item>
        <el-form-item label="自动隐藏" style="width: 50%" :label-width="secondLabelWidth">
          <template #label>
            <span
              >自动隐藏
              <el-tooltip class="item" effect="dark" placement="right">
                <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
                <template #content>
                  <p>播放结束自动隐藏</p>
                </template>
              </el-tooltip>
            </span>
          </template>
          <el-checkbox
            v-model="selectTargetData[0].option.autoHidden"
            :disabled="selectTargetData[0].option.loopPlay"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="延迟加载" style="width: 100%" :label-width="secondLabelWidth">
          <template #label>
            <span
              >延迟加载
              <el-tooltip class="item" effect="dark" placement="right">
                <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
                <template #content>
                  <p>结合延时时长，可设置延时加载</p>
                </template>
              </el-tooltip>
            </span>
          </template>
          <el-checkbox v-model="selectTargetData[0].option.delayPlayFirst" @change="update" />
          <sw-input-number
            v-if="selectTargetData[0].option.delayPlayFirst"
            style="width: 100px; display: inline-block"
            v-model.number="selectTargetData[0].option.delayLoadTime"
            unit="s"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </div> </template
  ></SwCollapseItem>

  <SwCollapseItem title="旋转设置" v-model="selectTargetData[0].option.rotateShow" @change="update" showIcon>
    <template #content>
      <StatusSelector label="绕X轴" :label-width="secondLabelWidth" :properties="['rotateX']">
        <SwSlider
          v-model="selectTargetData[0].option.rotateX"
          :max="180"
          :min="-180"
          :step="0.1"
          unit="°"
          @change="update"
        />
      </StatusSelector>

      <StatusSelector label="绕Y轴" :label-width="secondLabelWidth" :properties="['rotateY']">
        <SwSlider
          v-model="selectTargetData[0].option.rotateY"
          :max="180"
          :min="-180"
          :step="0.1"
          unit="°"
          @change="update"
        />
      </StatusSelector>

      <StatusSelector label="绕Z轴" :label-width="secondLabelWidth" :properties="['rotateZ']">
        <SwSlider
          v-model="selectTargetData[0].option.rotateZ"
          :max="180"
          :min="-180"
          :step="0.1"
          unit="°"
          @change="update"
        />
      </StatusSelector>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { computed, onMounted, toRaw } from "vue";

import type { ComponentMinioAsset } from "@screenwright/types";
import { isPlainObject } from "lodash-es";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import type { SwUploadChangePayload } from "@editor/base/SwUpload/SwUpload";
import { FileType } from "@editor/base/SwUpload/SwUpload";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";
import StatusSelector from "../../../attrsRender/components/statusAnimation/components/StatusSelector.vue";
import { FileTypeEnum } from "@screenwright/types";
import type { MenuItemForRender } from "@screenwright/types";

import { firstLabelWidth, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import { backgroundImageType, backgroundType, mixBlendMode } from "../dict";

// import videoUpload from "../openVideo/videoUpload/index.vue"
const { update, selectTargetData } = useUpdateInstance();

const videoValue = computed({
  get() {
    const data = selectTargetData.value[0].data;
    if (Array.isArray(data)) {
      return data.length > 0 ? data[0].value : "";
    } else if (isPlainObject(data)) {
      return data.value;
    } else {
      return data;
    }
  },
  set(newValue) {
    const data = selectTargetData.value[0].data;

    if (Array.isArray(data)) {
      // data[0].value = newValue;
      // selectTargetData.value[0].data = newValue;
      selectTargetData.value[0].data = [{ ...data[0], value: newValue }];
    } else if (isPlainObject(data)) {
      data.value = newValue;
    } else {
      selectTargetData.value[0].data = newValue;
    }
    // update();
  }
});

// 透明度 computed，当属性不存在时自动添加
const opacityValue = computed({
  get() {
    const option = selectTargetData.value[0].option;
    if (!option) {
      return 1; // 默认值
    }
    return option.opacity !== undefined ? option.opacity : 1;
  },
  set(newValue) {
    const option = selectTargetData.value[0].option;
    if (!option) {
      selectTargetData.value[0].option = { opacity: newValue };
    } else {
      option.opacity = newValue;
    }
    update();
  }
});
/**
 * 文件上传完成 处理是资源从资产库获取的情况
 * @param value 文件信息
 */
const onFileChange = (value: SwUploadChangePayload | MenuItemForRender) => {
  if ("assetType" in value && value.assetType === FileTypeEnum.personalPageAssets) {
    selectTargetData.value[0].minioArr = [toRaw({ ...value })] as unknown as ComponentMinioAsset[];
  }

  update();
};
onMounted(() => {
  if (!("opacity" in selectTargetData.value[0].option)) {
    selectTargetData.value[0].option.opacity = 1;

    update();
  }
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
.sw-label-type {
  width: 100%;
  :deep(.el-select) {
    margin-right: 5px;
  }
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
  .sw-label-type-number {
    position: relative;
    top: -2px;
  }
}
</style>
