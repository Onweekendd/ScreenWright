<template>
  <div class="simple-barrage-global">
    <el-form-item label="弹幕行数" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.lineNum"
        unit="行"
        :controls="false"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="弹幕速度" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.speed" :max="1" :min="0" :step="0.01" @change="update" />
    </el-form-item>

    <el-form-item label="自动循环" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.loop" @change="update" />
    </el-form-item>

    <el-form-item label="图片管理" :label-width="firstLabelWidth">
      <!-- 图片预览对话框 -->
      <image-preview-dialog :value="images" @update:value="handleImageSelect" />
    </el-form-item>

    <el-form-item label="图片高度范围(px)" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <sw-input-number
          v-model="selectTargetData[0].option.imageMinHeight"
          :min="20"
          :max="200"
          bottomLabel="最小"
          @change="update"
          controls
        />
        <sw-input-number
          v-model="selectTargetData[0].option.imageMaxHeight"
          :min="20"
          :max="200"
          bottomLabel="最大"
          @change="update"
          controls
        />
      </div>
    </el-form-item>

    <el-form-item label="图片适应方式" :label-width="firstLabelWidth">
      <el-select
        v-model="selectTargetData[0].option.imageObjectFit"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in objectFit" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { ElSelect } from "element-plus";

import { SwInputNumber } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";
import { objectFit } from "../../../text";

import { firstLabelWidth } from "../../constants";
import { ImagePreviewDialog } from "../../../exhibit";
import type { ImageItem } from "../../../exhibit";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

// 计算属性：获取图片数据
const images = computed(() => {
  return selectTargetData.value[0].data
    .map((item: any, index: number) => {
      if (item.type === "image") {
        return {
          src: item.text,
          title: `图片${index + 1}`
        };
      }
    })
    .filter((item: any) => item !== undefined);
});

// 处理图片选择
const handleImageSelect = (selectedImages: ImageItem[]) => {
  const component = selectTargetData.value[0];

  // 1. 创建新图片的Map，用于快速查找
  const newImageMap = new Map(selectedImages.map((img) => [img.src, img]));

  // 2. 处理数据，保持原有顺序
  const newData = component.data.reduce((acc: any[], item: any) => {
    // 2.1 如果是文本或非图片类型，直接保留
    if (!item.type || item.type === "text") {
      acc.push(item);
      return acc;
    }

    // 2.2 如果是图片，检查是否在新选择中存在
    if (newImageMap.has(item.text)) {
      acc.push(item);
      // 从Map中删除已处理的图片
      newImageMap.delete(item.text);
    }
    return acc;
  }, []);

  // 3. 将剩余的新图片添加到末尾
  newImageMap.forEach((img: any) => {
    newData.push({
      text: img.src,
      type: "image"
    });
  });

  // 4. 更新数据
  component.data = newData;
  update();
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();

.simple-barrage-global {
  .flex {
    display: flex;

    &.flex-center-between {
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
  }

  .upload-box {
    width: 99%;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    border-radius: 4px;
    position: relative;
    height: 103px;
    text-align: center;
    line-height: 103px;
    background: #1a1e27;
    border-radius: 4px;
    border: 1px solid #333543;

    .el-button {
      width: 70px;
      height: 25px;
      background-image: -webkit-gradient(linear, left top, left bottom, from(#8b58e7), to(#642cff));
      background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
      border-color: transparent;
      border-radius: 4px;
      text-align: center;
      padding: 0 !important;
    }

    &:hover {
      border-color: #642cff;
    }
  }
}
</style>
