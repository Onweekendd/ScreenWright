<template>
  <div class="data-web-socket">
    <dataSelect v-model="input" :type="DataSourceType.WEBSOCKET" @change="handleChange" />
    <el-form-item label="Base URL">
      <template #label>
        <el-tooltip effect="dark" placement="top">
          <template #content>
            填写Websocket地址(接口IP或域名)，预览时生效 <br />
            可参照通用格式：ws[s]://hostname[:port][/pathname]
          </template>
          <span class="flex flex-center"> Base URL<Icon type="QuestionFilled" class="tooltip-icon" size="12" /> </span>
        </el-tooltip>
      </template>
      <SwInput v-model="selectTargetData[0].websocketUrl" :disabled="true" />
    </el-form-item>
    <dataFilter />
    <dataResponse v-loading="loading" />
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

import SwInput from "@/components/SwInput/index.vue";
import Icon from "@/components/Icon/index.vue";
import { DataSourceType } from "@/views/source/type";

import { useUpdateInstance } from "../../useUpdateInstance";
import { useDataConfig } from "../useDataConfig";
import dataFilter from "./dataFilter.vue";
import dataResponse from "./dataResponse.vue";
import dataSelect from "./dataSelect.vue";
import type { DataSource } from "./useDataApi";

const { loading } = useDataConfig();
const input = ref("");
const { selectTargetData, update } = useUpdateInstance({
  history: false
});

const setBaseUrl = (target: DataSource) => {
  const parseTarget = target.config ? JSON.parse(target.config) : {};
  selectTargetData.value[0].websocketUrl = parseTarget.baseUrl;
};

const handleChange = async (target: DataSource) => {
  setBaseUrl(target);
  selectTargetData.value[0].dataSource = target;
  update();
};

onMounted(async () => {
  const dataSource = selectTargetData.value[0].dataSource;
  if (dataSource && Object.keys(dataSource).length > 0) {
    input.value = dataSource.id;
    setBaseUrl(dataSource as DataSource);
  } else {
    input.value = "";
    selectTargetData.value[0].websocketUrl = "";
  }
});
</script>

<style scoped lang="scss">
.tooltip-icon {
  cursor: pointer;
}
</style>
