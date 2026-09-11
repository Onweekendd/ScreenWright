<template>
  <div class="source-list">
    <el-table
      :data="tableData"
      border
      highlight-current-row
      stripe
      style="width: 100%; height: 100%"
      class="table-layout"
    >
      <template v-slot:empty>
        <div class="flex flex-center">
          <el-empty :image="logoImg" description="暂无数据" />
        </div>
      </template>
      <el-table-column type="index" label="序号" width="100" align="center" :resizable="false" />
      <el-table-column
        :resizable="false"
        show-overflow-tooltip
        header-align="center"
        v-for="item in currentColumn"
        :key="item.prop"
        :label="item.label"
        :align="item.align ? item.align : 'left'"
        :width="item.width ? item.width : 120"
      >
        <template v-slot="{ row }">
          <template v-if="item.icon">
            <img class="prev-img" v-if="item.icon" :src="getImg(row)" />
            <span v-if="item.prop === 'size'">{{ setBytesToSize(row[item.prop]) }}</span>
            <span v-else>{{ row[item.prop] }}</span>
          </template>
          <template v-else>
            <span v-if="item.prop === 'baseUrl'">
              {{ row.config ? JSON.parse(row.config).baseUrl : "" }}
            </span>
            <span v-else>{{ row[item.prop] }}</span>
          </template>
        </template>
      </el-table-column>

      <!--操作 fixed="right"-->
      <el-table-column :resizable="false" label="操作" align="center">
        <!-- v-if="oper === 'handle'" -->
        <!-- @click="onEvent($event, scope.row)" -->
        <!-- v-slot="{ row }" -->
        <template v-slot="{ row }">
          <div class="ctrl-1">
            <div class="button-list">
              <span
                @click="handleBtnClick(evt.value, row)"
                :class="['button-list-btn active ']"
                v-for="evt in eventBtns"
                :key="evt.name"
                :value="evt.value"
              >
                <icon :type="evt.icon" size="14" />
                <span>{{ evt.name }}</span>
              </span>
            </div>
          </div>
        </template>

        <!-- <div class="ctrl-control ctrl-3" v-if="oper === 'check'">
            <el-radio v-model="radioValue" :label="scope.row" @change="onSelect(scope.row)"></el-radio>
          </div> -->
      </el-table-column>
    </el-table>
  </div>
</template>
<script lang="ts" setup>
import logoImg from "@/assets/image/bg/empty.png";
import api from "@/assets/image/table/api.png";
import defaultIcon from "@/assets/image/table/api.png";
import csv from "@/assets/image/table/csv.png";
import dm from "@/assets/image/table/dm.png";
import json from "@/assets/image/table/json.png";
import geojson from "@/assets/image/table/json.png";
import mysql from "@/assets/image/table/mysql.png";
import sqlServer from "@/assets/image/table/mysql.png";
import oracle from "@/assets/image/table/oracle.png";
import shp from "@/assets/image/table/shp.png";
import sql from "@/assets/image/table/sql.png";
import xls from "@/assets/image/table/xls.png";
import xlsx from "@/assets/image/table/xls.png";
import excel from "@/assets/image/table/xls.png";
import Icon from "@/components/Icon/index.vue";
import type { DbItem } from "@/model/DataModel";

// import { formatTime } from "@/utils/utils";
import { useSourceList } from "../useSourceList";

const { currentColumn, tableData, eventBtns } = useSourceList();

const emits = defineEmits(["actionClick"]);
const imgList: { [key: string]: string } = {
  csv,
  xls,
  xlsx,
  excel,
  shp,
  json,
  geojson,
  mysql,
  oracle,
  sqlServer,
  dm,
  api,
  sql,
  default: defaultIcon
};
const getImg = (info: DbItem): string => {
  let { type } = info;
  if (type) type = String(type).replace(".", "");
  return imgList[type] || imgList.default;
};
const setBytesToSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024,
    sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toPrecision(3) + " " + sizes[i];
};
const handleBtnClick = (evt: any, row: DbItem) => {
  emits("actionClick", evt, row);
};
</script>
<style lang="scss">
@import "../style/sourceList.scss";
</style>
