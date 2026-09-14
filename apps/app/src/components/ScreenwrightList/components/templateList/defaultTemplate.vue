<template>
  <div class="default-template flex" v-loading="loading">
    <div class="default-template-left" v-loading="leftLoading">
      <div
        class="default-template-left-tab"
        :class="{ 'is-active': activeTab === item.id }"
        v-for="item in leftTabs"
        :key="item.type"
        @click="handleTabClick(item)"
        :style="{ backgroundImage: `url(${setMinioUrl(item.coverUrl)})` }"
      >
        <div class="tab-info">
          {{ item.name }}
        </div>
      </div>
    </div>
    <div class="default-template-middle">
      <el-scrollbar style="height: 100%">
        <div class="template-right-list">
          <div class="right-item empty" @click="handleItemClick(undefined)" :class="{ 'is-active': currentId === 0 }">
            <img :src="defaultImage" />
            <div class="tab-info">空白项目</div>
            <Icon type="iconfont-duigou_kuai" class="item-icon" color="#67c23a" />
          </div>
          <div
            class="right-item"
            v-for="item in templateList"
            :key="item.id"
            :class="{ 'is-active': currentId === item.id }"
            @click="handleItemClick(item)"
          >
            <img :src="`${setMinioUrl(item.backgroundUrl)}`" />
            <div class="tab-info">
              {{ item.name }}
            </div>
            <Icon type="iconfont-duigou_kuai" class="item-icon" color="#67c23a" />
          </div>
        </div>
      </el-scrollbar>
    </div>
    <div class="default-template-right">
      <div class="empty">
        <img :src="currentItem ? setMinioUrl(currentItem.backgroundUrl) : defaultImage" />
        <div style="text-align: left" class="empty-text flex">
          <Icon type="Tickets" size="12" color="#fff" style="top: 10px; margin-right: 3px" />
          <span class="title">
            {{ currentItem ? currentItem.name : "空白项目" }}
          </span>
        </div>
        <p class="title-desc" v-html="getHtmlDesc" />
      </div>
      <div class="default-template-right-footer">
        <p class="item-label">项目名称</p>
        <sw-input v-model="name" placeholder="请输入应用名称" clearable ref="nameFtInputRef" @keyup.enter="confirm" />
        <p class="item-label">分组名称</p>
        <el-select popper-class="sw-select-dropdown" v-model="groupId" clearable>
          <el-option v-for="item in options" :key="item.id" :label="item.label" :value="item.id" />
        </el-select>
        <div class="template-add-form-footer">
          <el-button type="default" @click="cancel">取消</el-button>
          <el-button type="primary" @click="confirm">创建项目</el-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, inject, nextTick, onMounted, ref } from "vue";

import type { LargeScreeInfo } from "@screenwright/types";
import { SwInput } from "@screenwright/ui/input";
import { ElMessage } from "element-plus";
import { isNil } from "lodash-es";

// getDefaultTemplate
import { createDefaultTemplate, getDefaultTemplate } from "@/api/visual";
import { dialogInjectionKey } from "@/components/Dialog/constant";
import Icon from "@/components/Icon/index.vue";
import type { MenuItem } from "@/layout/Siderbar/components/config/menuConfig";
import { setMinioUrl } from "@/utils/config";

import defaultImage from "/img/default.1026.png";
const nameFtInputRef = ref<InstanceType<typeof SwInput> | null>(null);

interface FormProps {
  name: string;
}

interface Props {
  options: MenuItem[];
  defaultFormData?: FormProps;
  defaultGroupId?: number | string;
}
// const props =
const props = defineProps<Props>();
const activeTab = ref<number>(0);
const currentId = ref(0);
const currentItem = ref<LargeScreeInfo | undefined>(undefined);
const groupId = ref("");
const name = ref("");
const loading = ref(false);
const leftLoading = ref(false);
const templateIdMap = ref<Record<number, string>>({});
const { confirm, cancel } = inject(dialogInjectionKey)!;
const templateList = ref<Array<LargeScreeInfo>>([]);
const leftTabs = ref();
const handleTabClick = (item: { name: string; id: number }) => {
  console.log(props.options, "options");
  activeTab.value = item.id;
  setTemplateList(activeTab.value);
  setTemplateIdMap(activeTab.value);
};
const handleItemClick = async (item?: LargeScreeInfo) => {
  if (item) {
    currentItem.value = item;
    currentId.value = item.id;
  } else {
    currentItem.value = undefined;
    currentId.value = 0;
  }
  await nextTick();
  nameFtInputRef.value?.focus();
};
const setTemplateList = (tabId: number) => {
  const currentTab = leftTabs.value.find((tab: { id: number }) => tab.id === tabId);
  if (currentTab) {
    templateList.value = currentTab.templateList || [];
  } else {
    templateList.value = [];
  }
  console.log(templateList.value, "templateList");
};
const setTemplateIdMap = (tabId: number) => {
  const currentTab = leftTabs.value.find((tab: { id: number }) => tab.id === tabId);
  if (currentTab) {
    console.log(currentTab, "currentTab");
    templateIdMap.value = currentTab.templateIdMap || {};
  } else {
    templateIdMap.value = {};
  }
  console.log(templateIdMap.value, "templateIdMap.value");
};
const setLoading = (load: boolean) => {
  loading.value = load;
};
const getHtmlDesc = computed(() => {
  if (currentId.value) {
    return templateIdMap.value[currentId.value] || "暂无描述信息";
  }
  return "从空白项目开始创建一个全新的大屏应用";
});
const validate = async () => {
  if (name.value.length === 0) {
    ElMessage.error("项目名称不能为空");
    return {
      success: false,

      type: 0 // 默认的新建
    };
  }
  if (name.value.length > 20) {
    ElMessage.error("项目名称不能超过20个字");
    return {
      success: false,

      type: 0 // 默认的新建
    };
  }

  if (currentId.value === 0) {
    return {
      success: true,
      groupId: groupId.value === "" ? 0 : parseInt(groupId.value),
      name: name.value,
      type: 0 // 默认的新建
    };
  }

  setLoading(true);
  let data = {
    id: currentId.value,
    groupId: groupId.value === "" ? 0 : parseInt(groupId.value),
    name: name.value
  };
  let res = await createDefaultTemplate(data);

  console.log(res, "res");
  if (res.code === 200 && res.success) {
    setLoading(false);
    return {
      success: true,
      result: res.result,
      type: 1 // 说明是模板
    };
  }
  setLoading(false);
  ElMessage.error(res.message || "创建大屏失败");
  return {
    success: false,
    result: null
  };
};
const initTemplate = async () => {
  leftLoading.value = true;
  if (!isNil(props.defaultGroupId)) {
    groupId.value = props.defaultGroupId as string;
  }
  const res = await getDefaultTemplate();
  console.log(res, "默认模板列表");
  if (res.success && res.code === 200) {
    leftTabs.value = res.result;
    if (leftTabs.value.length > 0) {
      activeTab.value = leftTabs.value[0].id;
      setTemplateList(activeTab.value);
      setTemplateIdMap(activeTab.value);
    }
  } else {
    ElMessage.error(res.message || "获取默认模板失败");
  }
  leftLoading.value = false;
};
onMounted(async () => {
  initTemplate();
  await nextTick();
  nameFtInputRef.value?.focus();
});
defineExpose({
  validate,
  setLoading
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
.default-template {
  width: 100%;
  height: 600px;
  display: flex;
  // 新增：确保flex容器不会溢出
  box-sizing: border-box;

  .default-template-left {
    width: 180px;
    height: 100%;
    padding-right: 10px;
    box-sizing: border-box;
    display: none;
  }

  .default-template-middle {
    // width: calc(100% - 180px - 180px);
    width: calc(100% - 180px);
    height: 100%;
    box-sizing: border-box; // 新增：约束宽度
    overflow: hidden; // 新增：防止中间区域溢出

    .template-right-list {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      box-sizing: border-box;
      padding: 0 6px;
      padding-top: 4px;
      // 新增：确保Grid容器不会被内容撑开
      max-width: 100%;
    }

    .right-item {
      width: 100%;
      box-sizing: border-box;
      position: relative;
      border-radius: 4px;
      cursor: pointer;
      background-color: #1d262e;
      // 核心新增：给item添加最大宽度，约束内部元素
      max-width: 100%;
      overflow: hidden; // 新增：防止item内部元素撑开

      img {
        width: 100%;
        height: 90px;
        object-fit: cover;
      }

      .item-icon {
        position: absolute;
        top: 2px;
        right: 2px;
        opacity: 0;
      }

      .tab-info {
        height: 30px;
        line-height: 30px;
        font-size: 12px;
        text-align: center;
        color: #e0e0e0;
        // 核心：强制省略号生效的属性（补充max-width）
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        max-width: 100%; // 新增：明确最大宽度
        box-sizing: border-box;
        padding: 0 4px; // 新增：左右留一点间距，避免文字贴边
      }
    }
  }

  .empty {
    cursor: pointer;
    max-width: 100%; // 新增
    overflow: hidden; // 新增
    img {
      width: 100%;
      height: 90px;
      object-fit: cover;
    }
    .tab-info {
      height: 30px;
      line-height: 30px;
      font-size: 12px;
      text-align: center;
      color: #e0e0e0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      max-width: 100%; // 新增
      box-sizing: border-box;
      padding: 0 4px; // 新增
    }
  }

  .default-template-left-tab {
    width: 175px;
    height: 102px;
    position: relative;
    margin-bottom: 10px;
    border-radius: 4px;
    cursor: pointer;
    background-size: cover;
    overflow: hidden; // 新增：约束左侧tab

    .tab-info {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      color: #fff;
      padding: 8px 12px;
      font-size: 12px;
      box-sizing: border-box;
      // 左侧tab的省略号优化
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    &:last-child {
      margin-bottom: 0;
    }
  }

  .default-template-right {
    position: relative;
    width: 180px;
    // flex: 1;
    padding-left: 6px;
    border-left: 1px solid #cccccc36;
    box-sizing: border-box; // 新增

    .empty {
      border-radius: 4px;
      img {
        border-radius: 4px;
        border: 1px solid #cccccc36;
      }
    }

    .empty-text {
      .title {
        font-size: 12px;
        color: #e0e0e0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%; // 新增
        height: 30px;
        line-height: 30px;
      }
      .title-desc {
        margin-top: 4px;
        font-size: 12px;
        color: #bfbfbf;
      }
    }

    .default-template-right-footer {
      position: absolute;
      width: 100%;
      bottom: 0;
      left: 0;
      padding-left: 10px;
      box-sizing: border-box; // 新增
      .item-label {
        color: #bfbfbf;
        margin-bottom: 10px;
        margin-top: 10px;
      }
    }
  }

  .template-add-form-footer {
    text-align: right;
    margin-top: 10px;
    .el-button--primary {
      font-size: 14px;
      color: #fff;
      border: none;
      border-radius: 2px;
      background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
      margin-left: 10px;
    }
    .el-button--default {
      background-color: #3d404c;
      font-size: 14px;
      color: #fff;
      border: none;
      border-radius: 2px;
    }
  }

  .is-active {
    box-shadow: 0px 0px 5px 0px var(--sw-theme-color);
    .item-icon {
      opacity: 1 !important;
    }
  }
}
</style>
