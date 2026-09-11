<template>
  <div class="ft-sub-menu">
    <template v-for="(item, index) in data" :key="item.value || index">
      <el-sub-menu
        v-if="item.children && item.children.length"
        :index="item.value"
        :data-class="indexClass"
        :teleported="false"
      >
        <template #title>
          <template v-if="option.showChildPrefix">
            <i
              v-if="!option.checkboxTabs"
              class="icon-image"
              :style="{
                backgroundImage: `url(${setMinioUrl(item.image)})`
              }"
            />
            <template v-else>
              <i
                v-if="option.checkboxTabs.childPrefix.isDataFirst"
                class="icon-image"
                :style="{
                  backgroundImage: `url(${setMinioUrl(item.image)})`,
                  ...childPrefixStyle
                }"
              />
              <img
                class="icon-image"
                v-if="!option.checkboxTabs.childPrefix.isDataFirst && option.checkboxTabs.childPrefix.url"
                :src="setMinioUrl(option.checkboxTabs.childPrefix.url)"
                alt=""
                :style="childPrefixStyle"
              />
            </template>
          </template>

          <el-checkbox v-model="item.isChecked" v-if="option.checkboxTabs.multiple" @change="handleCheck(item)" />
          <div v-html="item.label" :data-translate="item.label" />
          <!-- 显示后缀 -->
          <template v-if="option.showChildSuffix">
            <div
              :style="suffixStyle"
              :class="`suffix ${option.checkboxTabs.childSuffix.type}`"
              v-if="
                option.checkboxTabs.childSuffix.type === 'text' && option.checkboxTabs.childSuffix.text === 'length'
              "
            >
              {{ item.children.length }}
            </div>
            <div
              :style="suffixStyle"
              :class="`suffix ${option.checkboxTabs.childSuffix.type}`"
              v-if="option.checkboxTabs.childSuffix.type === 'text' && option.checkboxTabs.childSuffix.text === 'field'"
            >
              {{ option.checkboxTabs.childSuffix.customField }}
            </div>
            <img
              v-if="option.checkboxTabs.childSuffix.type === 'icon'"
              class="icon-image"
              :src="setMinioUrl(option.checkboxTabs.childSuffix.icon)"
              style="margin-left: 10px"
              alt=""
              :style="childSuffixIcon"
            />
          </template>
        </template>
        <ft-sub-menu :data="item.children" :option="option" :indexClass="indexClass + 1" @select="handleSubClick" />
      </el-sub-menu>
      <el-menu-item
        v-else
        :index="item.value"
        :disabled="item.disabled"
        :data-class="indexClass"
        @click="handleSubClick(item)"
      >
        <template #title>
          <template v-if="option.showChildPrefix">
            <i
              class="icon-image"
              :style="{ backgroundImage: `url(${setMinioUrl(item.image)})` }"
              v-if="!option.checkboxTabs"
            />
            <template v-else>
              <i
                v-if="option.checkboxTabs.childPrefix.isDataFirst"
                class="icon-image"
                :style="{
                  backgroundImage: `url(${setMinioUrl(item.image)})`,
                  ...childPrefixStyle
                }"
              />
              <img
                class="icon-image"
                v-if="!option.checkboxTabs.childPrefix.isDataFirst && option.checkboxTabs.childPrefix.url"
                :src="setMinioUrl(option.checkboxTabs.childPrefix.url)"
                alt=""
                :style="childPrefixStyle"
              />
            </template>
          </template>
          <el-checkbox v-model="item.isChecked" v-if="option.checkboxTabs.multiple" @change="handleCheck(item)" />
          <div v-html="item.label" :data-translate="item.label" />
          <template v-if="option.showChildSuffix">
            <div
              :style="suffixStyle"
              :class="`suffix ${option.checkboxTabs.childSuffix.type}`"
              v-if="option.checkboxTabs.childSuffix.type === 'text' && option.checkboxTabs.childSuffix.text === 'field'"
            >
              {{ option.checkboxTabs.childSuffix.customField }}
            </div>

            <img
              class="icon-image"
              style="margin-left: 10px"
              v-if="option.checkboxTabs.childSuffix.type === 'icon' && option.checkboxTabs.childSuffix.icon"
              :src="setMinioUrl(option.checkboxTabs.childSuffix.icon)"
              alt=""
              :style="childSuffixIcon"
            />
          </template>
        </template>
      </el-menu-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";

import { setMinioUrl } from "@material/minioUrl";

import FtSubMenu from "./subMenu.vue";

interface MenuItem {
  value: string;
  label: string;
  image: string;
  disabled?: boolean;
  isChecked?: boolean;
  children?: MenuItem[];
}

// 声明属性
withDefaults(
  defineProps<{
    data: MenuItem[];
    indexClass: string;
    option: any;
    suffixStyle?: CSSProperties;
    childSuffixIcon?: CSSProperties;
    childPrefixStyle?: CSSProperties;
  }>(),
  {
    data: () => [],
    indexClass: "2",
    option: () => ({}),
    suffixStyle: () => ({}),
    childSuffixIcon: () => ({}),
    childPrefixStyle: () => ({})
  }
);
// 声明事件
const emit = defineEmits(["select", "change"]);

// 方法
const handleSubClick = (info: MenuItem) => {
  emit("select", info);
};
const handleCheck = (item: MenuItem) => {
  emit("change", item);
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
</style>
