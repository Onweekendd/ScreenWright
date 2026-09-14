<template>
  <section class="left-animation-main">
    <div class="header">
      <div>
        <Icon name="动画" type="iconfont-donghua" size="20" />
        <div class="text-content">
          <div>动画</div>
          <div class="text-mini">animation</div>
        </div>
      </div>
      <Icon name="添加动画" type="iconfont-jiahao" @click="onAdd" />
    </div>
    <ul class="list" @click="clearSelect">
      <li
        v-for="item in animationList"
        :key="item.id"
        :class="{ select: selectId === item.id }"
        @click="goSelect(item)"
        @dblclick="() => onStartRenameLocal(item.name)"
      >
        <el-input
          class="editNameRef"
          style="width: 140px"
          :ref="(el: any) => setEditNameRef(el, item.id)"
          type="text"
          size="small"
          :model-value="item.name"
          @input="(value) => onChangeNameLocal(value)"
          @blur="() => onBlur(item.name)"
          @keyup.enter="() => onEndRenameLocal(item.name)"
          v-if="item.isRename"
        />
        <span v-else class="animation-name">{{ item.name }}</span>
        <Icon name="删除动画" type="iconfont-shanchu" @click="() => onDelete(item)" />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { ElInput, ElMessage, ElMessageBox } from "element-plus";

import Icon from "@/components/Icon/index.vue";

import type { AnimationItem } from "./type";
import { useCustomAnimation } from "./useCustomAnimation";

// Props 定义
const props = defineProps<{
  screenId: number;
  panelId?: number;
  activeStatusId?: string;
}>();

// 使用自定义动画 hook
const {
  getCurrentAnimationList,
  selectId,
  onAnimationSelect,
  onStartRename,
  onChangeName,
  onAddAnimation,
  onDeleteAnimation,
  onReNameFinish,
  onTimeLineScroll
} = useCustomAnimation();

// 本地状态
const unChangeName = ref<string>("");
const isFirstChange = ref<boolean>(false);
const editNameRefs = ref<Map<string, any>>(new Map());

// 计算属性
const animationList = computed(() => {
  return getCurrentAnimationList({
    panelId: props.panelId,
    statusId: props.activeStatusId
  });
});

// 设置编辑输入框引用
const setEditNameRef = (el: any, id: string) => {
  if (el) {
    editNameRefs.value.set(id, el);
  } else {
    editNameRefs.value.delete(id);
  }
};

// 删除动画
const onDelete = async (item: AnimationItem) => {
  try {
    await ElMessageBox.confirm(`是否删除动画：${item.name}?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      customClass: "sw-message-box"
    });

    await onDeleteAnimation({ animationId: item.id });
  } catch {
    // 用户取消删除
  }
};

// 添加动画
const onAdd = async () => {
  await onAddAnimation({
    panelId: props.panelId,
    statusId: props.activeStatusId
  });
};

// 选中动画
const goSelect = (animation: AnimationItem) => {
  if (animation.id !== selectId.value && !animation.isRename) {
    // 如果当前有动画正在重命名，先完成重命名验证
    const renamingItem = animationList.value.find((item) => item.isRename);
    if (renamingItem) {
      const currentName = renamingItem.name;
      if (!isValidAnimationName(currentName)) {
        ElMessage.error("动画名称不能为空或仅包含空格");
        // 恢复原名称
        onChangeName({
          id: renamingItem.id,
          name: unChangeName.value,
          isFirstChange: false
        });
        onReNameFinish(props.screenId);
        return;
      } else {
        // 名称有效，完成重命名
        onReNameFinish(props.screenId).then(() => {
          ElMessage.success("重命名成功");
        });
      }
    }

    onTimeLineScroll(0);
    onAnimationSelect(animation.id);
  }
};

// 开始重命名
const onStartRenameLocal = (currentName: string) => {
  unChangeName.value = currentName;
  isFirstChange.value = true;
  onStartRename();
};

// 修改动画名称
const onChangeNameLocal = (name: string | number) => {
  const isFirst = isFirstChange.value;
  if (isFirstChange.value) {
    isFirstChange.value = false;
  }
  onChangeName({
    id: selectId.value,
    name: name.toString(),
    isFirstChange: isFirst
  });
};

// 结束重命名
const onEndRenameLocal = async (finalName: string) => {
  if (!isValidAnimationName(finalName)) {
    ElMessage.error("动画名称不能为空或仅包含空格");
    return;
  }
  isFirstChange.value = false;

  try {
    await onReNameFinish(props.screenId);
    ElMessage.success("重命名成功");
  } catch (error) {
    console.error("重命名失败:", error);
  }
};

// 失去焦点
const onBlur = async (finalName: string) => {
  if (!isValidAnimationName(finalName)) {
    ElMessage.error("动画名称不能为空或仅包含空格");
    onChangeName({
      id: selectId.value,
      name: unChangeName.value,
      isFirstChange: false
    });
    isFirstChange.value = false;
    await onReNameFinish(props.screenId);
    return;
  }

  // 名称有效，完成重命名
  isFirstChange.value = false;
  try {
    await onReNameFinish(props.screenId);
    ElMessage.success("重命名成功");
  } catch (error) {
    console.error("重命名失败:", error);
  }
};

// 清除选中
const clearSelect = async (e: MouseEvent) => {
  e.stopPropagation();
  if (e.target === e.currentTarget) {
    // 如果当前有动画正在重命名，先完成重命名验证
    const renamingItem = animationList.value.find((item) => item.isRename);
    if (renamingItem) {
      const currentName = renamingItem.name;
      if (!isValidAnimationName(currentName)) {
        ElMessage.error("动画名称不能为空或仅包含空格");
        // 恢复原名称
        onChangeName({
          id: renamingItem.id,
          name: unChangeName.value,
          isFirstChange: false
        });
        await onReNameFinish(props.screenId);
        return;
      } else {
        // 名称有效，完成重命名
        try {
          await onReNameFinish(props.screenId);
          ElMessage.success("重命名成功");
        } catch (error) {
          console.error("重命名失败:", error);
        }
      }
    }

    onAnimationSelect("");
  }
};

// 验证动画名称是否有效
const isValidAnimationName = (name: string): boolean => {
  return typeof name === "string" && name.trim().length > 0;
};

// 生命周期
onMounted(() => {
  if (animationList.value.length > 0) {
    onAnimationSelect(animationList.value[0].id);
  }
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-input__wrapper");

.left-animation-main {
  flex-grow: 0;
  flex-shrink: 0;
  width: 100%;
  height: 100%;
  background-image: url("@/assets/image/bg/material-library/material-tree-bg.png");
  background-repeat: no-repeat;
  background-size: 100% 100%;
  display: flex;
  flex-direction: column;
  .header {
    color: #fff;
    font-size: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgb(46, 49, 63);
    border-bottom: 1px solid rgba(13, 7, 7, 0.6);
    padding: 5px 8px;
    height: 36px;
    box-sizing: border-box;
    & > div:first-child {
      display: flex;
      align-items: center;
      column-gap: 4px;
    }
    .text-content {
      line-height: 12px;
      font-size: 12px;
      text-align: left;

      .text-mini {
        font-size: 12px;
        scale: 0.6;
        transform-origin: left;
        margin-top: 2px;
      }
    }
    .click-icon {
      cursor: pointer;
      &:hover {
        color: var(--sw-theme-color);
      }
    }
  }
  .list {
    list-style: none;
    flex: 1;
    overflow-y: auto;
    padding-inline-start: 0px !important;
    margin: 0 !important;
    li {
      width: 100%;
      padding: 6px 8px;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
      font-size: 13px;
      height: 36px;
      cursor: pointer;
      // &:hover {
      //   background-image: linear-gradient(180deg, var(--sw-theme-color), var(--sw-theme-color));
      // }
      .icon {
        font-size: 16px;
        margin-right: 0px;
      }
    }
    .select {
      background-image: linear-gradient(180deg, var(--sw-theme-color), var(--sw-theme-color));
    }
    .animation-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
