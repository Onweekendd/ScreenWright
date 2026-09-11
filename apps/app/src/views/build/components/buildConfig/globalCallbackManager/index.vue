<template>
  <el-drawer
    class="sw-drawer"
    v-model="globalCallbackManagerShow"
    title="回调参数管理"
    size="480px"
    :destroy-on-close="true"
    direction="rtl"
  >
    <div class="sw-drawer__toolbar">
      <SwSearchInput
        v-model="queryString"
        placeholder="搜索回调参数名称"
        :query-data="suggestionsData"
        clearable
        @select="handleSelect"
        @change="handleChange"
      />
    </div>

    <div class="sw-drawer__scroll" v-if="hasData">
      <div class="sw-vtable cb-table">
        <div class="sw-vtable__head">
          <div class="sw-vtable__cell col-src">源组件</div>
          <div class="sw-vtable__cell col-arg">回调参数</div>
          <div class="sw-vtable__cell col-tgt">目标组件</div>
        </div>
        <div class="sw-vtable__row" v-for="cbName in cbCurrentObjKeys" :key="cbName">
          <div class="sw-vtable__cell col-src cb-stack">
            <template v-if="(callbackArgumentsManager?.[cbName]?.source?.length ?? 0) > 0">
              <span
                class="cb-chip"
                v-for="source in callbackArgumentsManager?.[cbName]?.source ?? []"
                :key="source.cbId"
                @click="handleClick(source)"
              >
                {{ getComponentName(source.id) }}
              </span>
            </template>
            <span v-else class="cb-none">无对应组件</span>
          </div>
          <div class="sw-vtable__cell col-arg cb-arg">{{ cbName }}</div>
          <div class="sw-vtable__cell col-tgt cb-stack">
            <template v-if="(callbackArgumentsManager?.[cbName]?.target?.length ?? 0) > 0">
              <span
                class="cb-chip"
                v-for="target in callbackArgumentsManager?.[cbName]?.target ?? []"
                :key="target.filterName"
                @click="handleClick(target)"
              >
                {{ getComponentName(target.id) }}
              </span>
            </template>
            <span v-else class="cb-none">无对应组件</span>
          </div>
        </div>
      </div>
    </div>
    <div class="sw-drawer__empty" v-else>
      <sw-empty size="60" :imgStyle="{ width: '60px', height: '60px' }" :desc="'暂无回调参数'" fontSize="12" />
    </div>

    <div class="sw-drawer__footer" v-if="pageConfig.total > pageConfig.size">
      <el-pagination
        background
        layout="total, prev, pager, next"
        :total="pageConfig.total"
        :current-page="pageConfig.current"
        @current-change="handleCurrentChange"
        :page-size="pageConfig.size"
      />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

import { uniq } from "lodash-es";

import SwEmpty from "@/components/SwEmpty/index.vue";
import SwSearchInput from "@/components/SwSearchInput/index.vue";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import type { CallbackSource, CallbackTarget } from "@/views/build/components/buildRender/type";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";
import { useNavAction } from "@/views/build/useNavAction";

import { useEditStore } from "../../buildRender/hooks/useEditStore";

// 定义类型
interface PageConfig {
  current: number;
  size: number;
  total: number;
}

const { callbackArgumentsManager } = useCallbackArguments();
const { setTargetSelectChart } = useEditStore();
const { globalCallbackManagerShow } = useNavAction();
const { allComponentMap } = useGlobalComponentData();

const getComponentName = (id: number | string) => {
  return allComponentMap.value.get(`${id}`)?.name ?? "无对应组件";
};

// 响应式状态
const queryString = ref("");
const pageConfig = ref<PageConfig>({
  current: 1,
  size: 10,
  total: 0
});

// 搜索建议数据
const suggestionsData = computed(() => {
  const keys = Object.keys(callbackArgumentsManager.value);
  // 使用lodash的uniq方法进行去重，并格式化为SwSearchInput所需的格式
  return uniq(keys).map((key) => ({
    value: key
  }));
});

// 监听queryString变化
watch(queryString, (v) => {
  pageConfig.value.current = 1;
  pageConfig.value.total = Object.keys(callbackArgumentsManager.value).filter((a) => a.includes(v)).length;
});

// 选择建议方法
const handleSelect = (item: Record<string, any>) => {
  queryString.value = item.value;
};

// 输入变化方法
const handleChange = (value: string) => {
  queryString.value = value;
};

// 计算属性
const cbCurrentObjKeys = computed(() => {
  const { current, size } = pageConfig.value;
  return Object.keys(callbackArgumentsManager.value)
    .filter((a) => a.includes(queryString.value))
    .slice((current - 1) * size, (current - 1) * size + size);
});

const hasData = computed(() => cbCurrentObjKeys.value.length > 0);

// 方法
const handleClick = (comp: CallbackSource | CallbackTarget) => {
  setTargetSelectChart(`${comp.id}`);

  nextTick(() => {
    globalCallbackManagerShow.value = false;
  });
};

const handleCurrentChange = (current: number) => {
  pageConfig.value.current = current;
};

// 生命周期钩子
onMounted(() => {
  nextTick(() => {
    pageConfig.value.current = 1;
    pageConfig.value.total = Object.keys(callbackArgumentsManager.value).length;
  });
});
</script>

<style lang="scss" scoped>
@import "src/style/theme.scss";

.cb-table {
  .col-src,
  .col-tgt {
    flex: 0 0 34%;
  }

  .col-arg {
    flex: 0 0 32%;
  }

  .cb-stack {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }

  .cb-arg {
    color: $sw-text-strong;
    word-break: break-all;
  }

  .cb-chip {
    max-width: 100%;
    padding: 3px 8px;
    border: 1px solid rgba($sw-purple-light, 0.5);
    border-radius: 4px;
    color: $sw-purple-light;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition:
      background-color 0.15s,
      border-color 0.15s;

    &:hover {
      background-color: $sw-active-bg;
      border-color: $sw-purple-light;
    }
  }

  .cb-none {
    color: $sw-text-muted;
  }
}
</style>
