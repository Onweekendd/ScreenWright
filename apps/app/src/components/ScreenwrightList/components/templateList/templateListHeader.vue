<template>
  <div class="template-list-header flex flex-justify-between flex-align-center">
    <div class="total-list">
      <span>{{ route.name }}</span>
      <span>/{{ curMenuLabel }}</span>
    </div>
    <div class="list-search flex flex-align-center">
      <el-input v-model="params.name" style="width: 226px" placeholder="请输入内容" :suffix-icon="Search" />
      <div class="sort-list">
        <el-dropdown popper-class="sw-popper">
          <span class="el-dropdown-link">
            {{ optionsName }}
            <el-icon class="el-icon--right">
              <arrow-down />
            </el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in sortTypeOptions"
                :key="item.value"
                @click.stop="orderByProps(item.value, item.sortType)"
              >
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <uploadButton />
    </div>
  </div>
</template>
<script setup lang="ts">
// import { ref } from "vue"
import { useRoute } from "vue-router";

import { ArrowDown, Search } from "@element-plus/icons-vue";

import uploadButton from "./uploadButton.vue";
import { useTemplateData } from "./useTemplateData";

const route = useRoute();
const { params, optionsName, sortTypeOptions, curMenuLabel, orderByProps } = useTemplateData();
</script>
<style lang="scss" scoped>
@import "../style/templateList.scss";
</style>
