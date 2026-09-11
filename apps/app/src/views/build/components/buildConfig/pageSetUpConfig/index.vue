<template>
  <div class="page-set-up-config">
    <pageSetUpHeader />
    <el-form class="group-config-form" label-width="90px" label-position="left">
      <el-form-item label="对齐工具">
        <alignList :itemList="alignListData" @click="handleAlignClick" />
      </el-form-item>
      <el-form-item label="分布工具">
        <alignList :itemList="distributionListData" @click="handleAlignClick" />
      </el-form-item>
      <el-form-item label="尺寸工具">
        <alignList :itemList="sizeListData" @click="handleAlignClick" />
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { useAction } from "@/views/build/components/buildRender/hooks/useAction";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";

import alignList from "./alignList.vue";
import pageSetUpHeader from "./pageSetUpHeader.vue";
import { actionDirection } from "./type";
import type { Item } from "./useSetUpList";
import { getCriticalPosition } from "./utils";
const { selectTargetData } = useEditStore();
const { updateComponentLayers } = useAction();

const alignListData = ref<Item[]>([
  { type: "iconfont-jurassic_horizalign-left", title: "左对齐", isActive: false, action: actionDirection.LEFT },
  { type: "iconfont-jurassic_horizalign-center", title: "水平居中", isActive: false, action: actionDirection.XCENTER },
  { type: "iconfont-jurassic_horizalign-right", title: "右对齐", isActive: false, action: actionDirection.RIGHT },
  { type: "iconfont-jurassic_verticalalign-top", title: "上对齐", isActive: false, action: actionDirection.TOP },
  {
    type: "iconfont-jurassic_verticalalign-center",
    title: "垂直居中",
    isActive: false,
    action: actionDirection.YCENTER
  },
  { type: "iconfont-jurassic_verticalalign-bottom", title: "下对齐", isActive: false, action: actionDirection.BOTTOM }
]);
const distributionListData = ref([
  { type: "iconfont-jurassic_HorCenter-fenbu", title: "横向分布", isActive: false, action: actionDirection.XLAYOUT },
  { type: "iconfont-jurassic_VerCenter-fenbu", title: "纵向分布", isActive: false, action: actionDirection.YLAYOUT }
]);
const sizeListData = ref([
  { type: "iconfont-denggao", title: "等高", isActive: false, action: actionDirection.EQUALHEIGHT },
  { type: "iconfont-dengdaxiao", title: "等宽", isActive: false, action: actionDirection.EQUALWIDTH },
  { type: "iconfont-dengkuan", title: "等尺寸", isActive: false, action: actionDirection.EQUALSIZE }
]);
const handleAlignClick = (item: Item) => {
  console.log("对齐工具", item);
  const positionInfo = getCriticalPosition(selectTargetData.value);

  if (positionInfo) {
    const lengthSize = selectTargetData.value.length;
    const lenPiece = lengthSize - 1;
    const lastComp = selectTargetData.value[lengthSize - 1];
    const { POS_Top, POS_Right, POS_Bottom, POS_Left } = positionInfo;

    /**
     * 通用更新分组元素位置的方法（提取重复逻辑）
     * @param target 目标元素（可能包含children）
     * @param type 位置类型：left/top
     * @param val 目标值
     */
    const updateGroupPosition = (target: any, type: "left" | "top", val: number) => {
      const isGroup = target.children && target.children.length > 0;
      if (isGroup) {
        // 计算目标值与当前值的偏移量
        const dis = val - target[type];
        const children = target.children || [];
        // 同步更新子元素位置
        children.forEach((t: any) => {
          t[type] = target.isOuter ? dis + t[type] : t[type];
        });
        // 更新父元素位置
        target[type] = val;
      } else {
        // 非分组元素直接赋值
        target[type] = val;
      }
    };

    selectTargetData.value.forEach((data: any, i: number) => {
      // 左对齐
      if (item.action === actionDirection.LEFT) {
        updateGroupPosition(data, "left", POS_Left);
      }
      // 水平居中
      else if (item.action === actionDirection.XCENTER) {
        const xCenterVal = POS_Left + (POS_Right - POS_Left) / 2 - data.component.width / 2;
        updateGroupPosition(data, "left", xCenterVal);
      }
      // 右对齐（修正原代码错误）
      else if (item.action === actionDirection.RIGHT) {
        const rightVal = POS_Right - data.component.width;
        updateGroupPosition(data, "left", rightVal);
      }
      // 上对齐
      else if (item.action === actionDirection.TOP) {
        updateGroupPosition(data, "top", POS_Top);
      }
      // 垂直居中
      else if (item.action === actionDirection.YCENTER) {
        const yCenterVal = POS_Top + (POS_Bottom - POS_Top) / 2 - data.component.height / 2;
        updateGroupPosition(data, "top", yCenterVal);
      }
      // 下对齐
      else if (item.action === actionDirection.BOTTOM) {
        const bottomVal = POS_Bottom - data.component.height;
        updateGroupPosition(data, "top", bottomVal);
      }
      // 横向分布
      else if (item.action === actionDirection.XLAYOUT) {
        const xLayoutVal = POS_Left + ((POS_Right - POS_Left - lastComp.component.width) / lenPiece) * i;
        updateGroupPosition(data, "left", xLayoutVal);
      }
      // 纵向分布
      else if (item.action === actionDirection.YLAYOUT) {
        const yLayoutVal = POS_Top + ((POS_Bottom - POS_Top - lastComp.component.height) / lenPiece) * i;
        updateGroupPosition(data, "top", yLayoutVal);
      }
      // 等高
      else if (item.action === actionDirection.EQUALHEIGHT) {
        data.component.height = selectTargetData.value[0].component.height;
        console.log("data.component.height", data.component.height);
      }
      // 等宽
      else if (item.action === actionDirection.EQUALWIDTH) {
        data.component.width = selectTargetData.value[0].component.width;
      }
      // 等尺寸
      else if (item.action === actionDirection.EQUALSIZE) {
        data.component.width = selectTargetData.value[0].component.width;
        data.component.height = selectTargetData.value[0].component.height;
      }

      updateComponentLayers(data);
    });
  }
};
</script>
<style lang="scss" scoped>
.page-set-up-config {
  width: 100%;
  height: 100%;
  .group-config-form {
    padding: 0 16px;
    width: 100%;
    margin-top: 20px;
    .align-list {
      width: 100%;
    }
    :deep(.el-form-item__label) {
      padding: 0 !important;
      color: #b4b7c1 !important;
      font-size: 12px;
      font-family:
        Source Han Sans CN-Normal,
        Source Han Sans CN;
      font-weight: 400;
    }
  }
}
</style>
