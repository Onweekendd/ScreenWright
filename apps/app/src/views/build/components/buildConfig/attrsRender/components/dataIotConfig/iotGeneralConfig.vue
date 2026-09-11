<template>
  <div class="data-iot-config">
    <el-form-item label="设备地址">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        v-model="iotConfig.iotAddress"
        placeholder="请选择设备地址"
        clearable
        @change="onIotAddressChange"
      >
        <el-option v-for="item in deviceAddressOptions" :key="item.value" :label="item.name" :value="item.value" />
      </el-select>
    </el-form-item>

    <el-form-item label="设备分组">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        v-model="iotConfig.groupId"
        placeholder="请选择设备分组"
        clearable
        @change="update"
      >
        <el-option v-for="item in groupOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <!-- 产品分类 -->
    <el-form-item label="产品分类">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        v-model="iotConfig.productCategoryId"
        placeholder="请选择产品分类"
        clearable
        @change="onCategoryChange"
        filterable
      >
        <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <!-- 所属产品 -->
    <el-form-item label="所属产品" v-show="iotConfig.productCategoryId">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        v-model="iotConfig.productCode"
        @change="onBelongChange"
        placeholder="请选择所属产品"
        clearable
        filterable
      >
        <el-option v-for="item in belongOptions" :key="item.code" :label="item.label" :value="item.code" />
      </el-select>
    </el-form-item>

    <!-- 设备 -->
    <el-form-item label="设备" v-show="iotConfig.productCode">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        v-model="iotConfig.deviceId"
        placeholder="请选择设备"
        clearable
        filterable
        @change="onDeviceChange"
      >
        <el-option v-for="item in deviceOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <!-- 操作 -->
    <el-form-item label="操作" v-show="iotConfig.deviceId">
      <el-select
        popper-class="sw-select-dropdown"
        class="sw-select"
        v-model="iotConfig.operateCode"
        placeholder="请选择操作"
        clearable
        @change="onOperateChange"
        filterable
      >
        <el-option v-for="item in operateOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <template v-for="item in customAttributeList" :key="item.displayName">
      <el-form-item :label="item.displayName" v-if="iotConfig.params && item.attributeName in iotConfig.params">
        <template v-if="['STRING'].includes(item.attributeType)">
          <SwInput
            v-model="iotConfig.params[item.attributeName]"
            :placeholder="`请输入${item.displayName + item.attributeName}`"
            clearable
            @change="update"
          />
        </template>
        <template v-else-if="['BOOLEAN'].includes(item.attributeType)">
          <el-checkbox v-model="iotConfig.params[item.attributeName]" @change="update" />
        </template>
        <template v-else-if="['INT', 'BYTE', 'SHORT', 'LONG', 'FLOAT', 'DOUBLE'].includes(item.attributeType)">
          <SwInputNumber v-model="iotConfig.params[item.attributeName]" controls @change="update" />
        </template>
        <template v-else-if="['OPTION'].includes(item.attributeType)">
          <el-select
            popper-class="sw-select-dropdown"
            class="sw-select"
            v-model="iotConfig.params[item.attributeName]"
            clearable
            filterable
            @change="update"
          >
            <el-option v-for="citem in item.options" :key="citem.value" :label="citem.label" :value="citem.value" />
          </el-select>
        </template>
      </el-form-item>
    </template>
    <!-- <dataFilter />
    <dataResponse /> -->
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";

import { getDataSocketList } from "@/api/dataSource";
import SwInput from "@/components/SwInput/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import type { DbItem } from "@/model/DataModel";
import to from "@/utils/await-to-js";

// import dataFilter from "@/views/build/components/buildConfig/attrsRender/components/dataFilter.vue";
// import dataResponse from "@/views/build/components/buildConfig/attrsRender/components/dataResponse.vue";
import { useExtendedIot } from "./useExtendedIot";

// 使用扩展的 IoT 配置 hooks
const {
  iotConfig,
  deviceAddressOptions,
  deviceAddressRawData,
  groupOptions,
  deviceOptions,
  initializeData,
  update,
  categoryOptions,
  belongOptions,
  operateOptions,
  customAttributeList,
  onCategoryChange,
  onBelongChange,
  onOperateChange,
  onDeviceChange,
  onIotAddressChange
} = useExtendedIot();

// 查询参数
const params = {
  current: 1,
  groupId: -2,
  name: "",
  size: 100,
  status: -1
};

// 初始化数据
onMounted(async () => {
  // 获取设备地址数据
  const [error, res] = await to(getDataSocketList(params));
  if (error || !res) {
    return;
  }
  deviceAddressRawData.value = res.result.records as DbItem[];

  // 初始化其他数据
  await initializeData();
});
</script>
