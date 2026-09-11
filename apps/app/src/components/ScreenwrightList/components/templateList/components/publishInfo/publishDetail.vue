<template>
  <div class="publish-detail" v-if="params">
    <div class="label-item flex flex-align-center flex-justify-between">
      <div class="label-item-value">
        <span class="label label-width-72"> 发布版本: </span>
        <span class="value">V{{ params.versionCode }}</span>
      </div>
      <div class="control-btn fs-12">
        <span class="copyBtn" @click="setCopyCode">复制分享信息</span>
      </div>
    </div>
    <div class="label-item flex flex-align-center">
      <span class="label label-width-72"> 版本描述: </span>
      <span class="value">
        {{ params.versionDesc || "--" }}
      </span>
    </div>
    <div class="label-item flex flex-align-center">
      <el-checkbox v-model="publishStatus" @change="handleStatus"> 发布状态 【发布链接如下】 </el-checkbox>
    </div>
    <div class="terminal-table">
      <div class="table-link flex flex-align-center">
        <span class="link-name">
          {{ params.name }}
        </span>
        <span class="link-url"> {{ linkUrl }} </span>
      </div>
      <div class="table-link flex flex-align-center" v-for="item in terminalPublishLinks" :key="item.linkUrl">
        <span class="link-name">
          {{ item.name }}
        </span>
        <span class="link-url">
          {{ item.linkUrl }}
        </span>
      </div>
    </div>

    <div class="label-item flex flex-align-center">
      <el-checkbox v-model="params.hasPassword" @change="handlePassword"> 加密发布 </el-checkbox>
    </div>
    <div class="label-item flex flex-align-center" v-if="params.hasPassword">
      <span class="label label-width-72">密码：</span>
      <el-input :disabled="true" v-model="params.password" />
      <span class="resetBtn" @click="resetPassword">重置密码</span>
    </div>
    <div class="label-item flex flex-align-center">
      <el-checkbox v-model="params.hasExpirationTime" @change="handleHasExpirationTime"> 设置发布截止时间 </el-checkbox>
    </div>
    <!-- 截至时间组件 -->
    <DeadlineTime
      @change="handleExpirationTime"
      v-model="params.expirationTime"
      :hasExpirationTime="params.hasExpirationTime"
    />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import type { CheckboxValueType } from "element-plus";
import { ElMessage } from "element-plus";

import { copy } from "@/utils/utils";

import DeadlineTime from "./DeadlineTime.vue";
import { usePublishInfo } from "./usePublishInfo";

const {
  params,
  linkUrl,
  updatePublishStatus,
  updatePassword,
  updateExpirationTime,
  resetPassword,
  terminalPublishLinks
} = usePublishInfo();

// const isSameVersion = computed(() => {
//   return `${params.value?.versionCode}` === `${getVersionCode()}`;
// });

// status 从接口回来是 boolean | null，而 el-checkbox 的 modelValue 不收 null——
// 中转一层，勾选态按 false 显示；真正的发布动作仍走 @change，不经这里
const publishStatus = computed({
  get: () => params.value?.status ?? false,
  set: (value: boolean) => {
    if (params.value) {
      params.value.status = value;
    }
  }
});

const handleStatus = (val: CheckboxValueType) => {
  updatePublishStatus(val as boolean);
};
const handlePassword = (val: CheckboxValueType) => {
  updatePassword(val as boolean);
};
const handleHasExpirationTime = (val: CheckboxValueType) => {
  updateExpirationTime(val as boolean);
};
const handleExpirationTime = (val: any) => {
  updateExpirationTime(true, val);
};

const setCopyCode = async () => {
  // 提取公共模板部分
  const getCommonTemplate = () => {
    // 单独处理终端交互：换行 + 每个终端项带序号、分号、单独一行
    const terminalStr =
      terminalPublishLinks.value.length > 0
        ? terminalPublishLinks.value.map((i, index) => `  ${index + 1}. ${i.name}：${i.linkUrl} ;`).join("\n")
        : "无";
    return `链接：${linkUrl.value}
  终端：无
  版本：V${params.value?.versionCode || "--"}
  终端交互:
${terminalStr}
  有效期：${params.value?.hasExpirationTime ? params.value.expirationTime : "永久"}`;
  };

  // 拼接密码（如果有）
  let template = params.value?.hasPassword
    ? `${getCommonTemplate()}
  密码： ${params.value?.password || "--"}`
    : getCommonTemplate();

  // 去除模板首尾多余空格（保留内部格式）
  template = template.trim();
  copy(template);
  ElMessage.success("复制成功");
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.label-width-72 {
  width: 72px;
}
.label-item {
  @include checkbox-style();
  @include common-element-style(".el-input__wrapper");
  .copyBtn {
    cursor: pointer;
    color: #ffffff;
    padding: 5px 5px;
    border-radius: 5px;
    background-image: linear-gradient(180deg, #8b58e7, #642cff);
  }
  margin: 10px 0;
  color: #bfbfbf;
  font-size: 14px;
  &.el-input {
    width: calc(100% - 72px);
  }
  .resetBtn {
    cursor: pointer;
    text-align: center;
    width: 100px;
    text-decoration: underline;
  }
}

.terminal-table {
  font-size: 12px;
  color: #859094;
  border: 1px solid #434749;
  border-bottom: none;
  box-sizing: border-box;
  background: #141825;
  .table-link {
    padding: 5px;
    border-bottom: 1px solid #434749;
    position: relative;
    .link-name {
      width: 100px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      &::after {
        content: "";
        width: 1px;
        height: 100%;
        background: #434749;
        position: absolute;
        top: 0;
        left: 105px;
      }
    }
    .link-url {
      padding-left: 5px;
      width: calc(100% - 110px);
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      display: -webkit-box;
      line-height: 1.5;
    }
  }
}
</style>
