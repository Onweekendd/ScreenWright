<template>
  <div>
    <template v-if="currentAction">
      <el-form-item label="数据类型" :label-width="85">
        <configSelect field="tcpudpDataType" v-model="currentAction.tcpudpConfig.dataType" @change="onDataTypeChange" />
      </el-form-item>
      <el-form-item label="数据源" :label-width="85">
        <configSelect
          :option="filterDataTypeOptions"
          v-model="currentAction.tcpudpConfig.dataSourceId"
          @change="onDataSourceChange"
        />
      </el-form-item>
      <el-form-item
        label="发送方式"
        :label-width="85"
        v-show="currentAction.tcpudpConfig?.dataType === tcpudpDataTypeEnum.UDP"
      >
        <configSelect field="UDPSendtypeList" v-model="currentAction.tcpudpConfig.sendType" @change="update" />
      </el-form-item>
      <el-form-item label="发送数据" :label-width="85">
        <el-input type="textarea" v-model="currentAction.tcpudpConfig.sendData" @change="update" />
      </el-form-item>
      <el-form-item label="延时(ms)" :label-width="85">
        <sw-input-number v-model="currentAction.tcpudpConfig.dataDelay" @change="update" />
      </el-form-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import { tcpudpDataTypeEnum } from "@/views/build/components/buildConfig/constants/index";
import { DataSourceType } from "@/views/source/type";

import { useDataApi } from "../../useDataApi";
import ConfigSelect from "../components/configSelect.vue";
import { useCustomEvent } from "../useCustomEvent";

const dataTypeMapDataSourceType = {
  [tcpudpDataTypeEnum.None]: undefined,
  [tcpudpDataTypeEnum.TCP]: DataSourceType.TCPUDP,
  [tcpudpDataTypeEnum.UDP]: DataSourceType.TCPUDP,
  [tcpudpDataTypeEnum.WebSocket]: DataSourceType.WEBSOCKET
};

const { currentAction, update } = useCustomEvent();

const { options, getOptionData } = useDataApi(dataTypeMapDataSourceType[currentAction.value?.tcpudpConfig.dataType]);

/**
 * 过滤数据源选项
 * 1. 如果是WebSocket，则返回所有数据源
 * 2. 如果是TCP/UDP，则返回对应类型的数据源
 */
const filterDataTypeOptions = computed(() => {
  if (currentAction.value?.tcpudpConfig.dataType === tcpudpDataTypeEnum.WebSocket) {
    return options.value.map((item) => {
      return {
        ...item,
        id: item.id.toString()
      };
    });
  }

  return options.value
    .filter((item) => item.type === currentAction.value?.tcpudpConfig.dataType)
    .map((item) => {
      return {
        ...item,
        id: item.id.toString()
      };
    });
});

watch(
  () => currentAction.value?.tcpudpConfig.dataType,
  async (val) => {
    if (val === tcpudpDataTypeEnum.None) {
      options.value = [];
      return;
    }

    options.value = await getOptionData(dataTypeMapDataSourceType[val]);
  }
);

/**
 * 处理数据类型变化的回调函数
 */
const onDataTypeChange = async () => {
  currentAction.value.tcpudpConfig.dataSourceId = "";
  currentAction.value.tcpudpConfig.sendData = "";
  currentAction.value.tcpudpConfig.dataDelay = 0;
  currentAction.value.tcpudpConfig.sendType = "";

  if (currentAction.value.tcpudpConfig.dataType === tcpudpDataTypeEnum.None) {
    options.value = [];
    return;
  }

  options.value = await getOptionData(dataTypeMapDataSourceType[currentAction.value?.tcpudpConfig.dataType]);

  // 调用原来的update函数
  update();
};

const onDataSourceChange = async () => {
  currentAction.value.tcpudpConfig.dataSourceObj =
    options.value.find((item) => item.id === currentAction.value.tcpudpConfig.dataSourceId) ?? null;

  update();
};

const initSelectOption = async () => {
  if (!currentAction.value || !currentAction.value.tcpudpConfig || !currentAction.value.tcpudpConfig.dataType) return;
  options.value = await getOptionData(dataTypeMapDataSourceType[currentAction.value?.tcpudpConfig.dataType]);
};

onMounted(async () => {
  await nextTick();
  initSelectOption();
});
</script>
