<template>
  <div class="export-record">
    <div class="export-control">
      <span :class="{ 'is-select': params.type === 'import' }" @click="handleTab('import')">导入</span>
      <span :class="{ 'is-select': params.type === 'export' }" @click="handleTab('export')">导出</span>
    </div>
    <div class="select-content flex flex-align-center">
      <div class="select-content-item flex flex-align-center">
        <span class="label">状态:</span>
        <el-select @change="getListData" v-model="params.status" popper-class="sw-select-dropdown">
          <el-option v-for="item in statusOption" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
      <div class="select-content-item flex flex-align-center">
        <span class="label">类型:</span>
        <el-select @change="getListData" v-model="params.domain" popper-class="sw-select-dropdown">
          <el-option v-for="item in domainOption" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </div>

    <div class="record-list" v-loading="loading">
      <template v-if="listData.length > 0">
        <div class="record-list-header">
          <span>序号</span>
          <span>文件名称</span>
          <span>状态</span>
          <span v-if="params.type === 'import'">导入时间</span>
          <span>{{ params.type === "import" ? "完成时间" : "导入时间" }}</span>
          <template v-if="params.type === 'export'">
            <span>导出类型</span>
            <span>操作</span>
          </template>
        </div>
        <div class="list-item flex flex-center" v-for="(item, index) in listData" :key="index">
          <span>{{ index + 1 }}</span>
          <span>{{ getName(item.name) }}</span>
          <span class="status-text" :class="{ 'is-finish': item.status === 3 }">
            {{ getLabel(item.status) }}
          </span>
          <span v-if="params.type === 'import'">
            {{ item.createdTime || "--" }}
          </span>
          <span>
            {{ item.finishedTime || "--" }}
          </span>
          <template v-if="params.type === 'export'">
            <span>
              {{ setExportType(item.exportType) }}
            </span>
            <span class="is-pointer" @click.stop="downloadFile(item)">
              {{ item.status == 3 && (item.exportType === 0 || item.exportType === 4) ? "下载" : "" }}
            </span>
          </template>
        </div>
      </template>
      <div class="flex flex-center" v-else>
        <el-empty description="暂无数据" :image="logoImg" />
      </div>
    </div>

    <div class="pagination-wrapper">
      <Pagination
        :total="total"
        v-model:pageNum="params.current"
        v-model:pageSize="params.size"
        @pagination="handlePagination"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";

import { getZipFile, queryPageInvitation } from "@/api/team";
import logoImg from "@/assets/image/bg/empty.png";
import type { PaginationEvent } from "@/components/Pagination/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import type { queryPageInvitationReq, queryPageItemRes } from "@/model/Team";
import { downloadBlob } from "@/utils/utils";

const total = ref(0);
const listData = ref<queryPageItemRes[]>([]);
const params = ref<queryPageInvitationReq>({
  current: 1,
  size: 10,
  domain: "large_screen",
  status: 0,
  type: "import"
});
const loading = ref(false);
const statusOption = ref([
  { label: "全部", value: 0 },
  { label: "进行中", value: 1 },
  { label: "失败", value: 2 },
  { label: "已完成", value: 3 },
  { label: "已失效", value: 4 }
]);
const exportOption = [
  { label: "应用文件", value: 0 },
  { label: "离线文件", value: 1 },
  { label: "本地Nginx服务器", value: 2 },
  { label: "客户端exe程序", value: 3 },
  { label: "三维场景", value: 4 },
  { label: "splat文件", value: 5 }
];

const domainOption = ref([
  { label: "全部", value: 0 },
  { label: "大屏应用", value: "large_screen" },
  { label: "三维场景", value: "scene" },
  { label: "城市模板", value: "cityScene" }
]);

const getLabel = (val: number) => {
  const target = statusOption.value.find((item) => item.value === val);
  return target ? target.label : "";
};
const setExportType = (n: number | null) => {
  return exportOption.find((i) => i.value == n)?.label || "--";
};
const getName = (name: string) => {
  if (name.includes("-")) {
    return name.split("-").shift();
  }
  return name;
};
const downloadFile = (info: queryPageItemRes) => {
  if (info.attachmentUrl && (info.exportType === 0 || info.exportType === 4))
    getZipFile(info.attachmentUrl).then((res) => {
      downloadBlob(res, info.name);
    });
};

const getListData = async () => {
  loading.value = true;
  const transFormParams = {
    ...params.value,
    status: params.value.status === 0 ? null : params.value.status
  };
  const res = await queryPageInvitation(transFormParams as queryPageInvitationReq);
  console.log(res);
  if (res.success) {
    listData.value = res.result.records;
    total.value = res.result.total;
  }
  loading.value = false;
};

const handleTab = (val: string) => {
  params.value.type = val;
  listData.value = [];
  params.value.current = 1;
  total.value = 0;
  getListData();
};

const handlePagination = (val: PaginationEvent) => {
  params.value.current = val.page;
  params.value.size = val.pageSize;
  getListData();
};
onMounted(() => {
  getListData();
});
</script>
<style lang="scss" scoped>
@import "./exportRecord.scss";
</style>
