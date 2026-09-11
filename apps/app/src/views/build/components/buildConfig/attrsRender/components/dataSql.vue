<template>
  <div class="data-sql">
    <dataSelect v-model="input" :type="DataSourceType.DB" @change="selectChange" />
    <div class="response-wrapper">
      <MonacoEditor language="sql" @change="update" v-model="selectTargetData[0].sql" v-if="cIScreenCreator" />
      <div class="icon-position" @click="handleFullScreen">
        <Icon type="iconfont-fangda" />
      </div>
    </div>

    <dataFilter />

    <dataResponse />
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import Icon from "@/components/Icon/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
// import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";
import { useDialog } from "@/hooks/useDialog";
import { useUserStore } from "@/store/modules/user";
import { DataSourceType } from "@/views/source/type";

import { useLargeScreenInfo } from "../../../../useLargeScreenInfo";
import { useUpdateInstance } from "../../useUpdateInstance";
import dataFilter from "./dataFilter.vue";
import dataResponse from "./dataResponse.vue";
import dataSelect from "./dataSelect.vue";
import dataSqlDialog from "./dataSqlDialog.vue";

const { navInfo } = useLargeScreenInfo();
const { userInfo } = useUserStore();

// const { emitFilterTrigger } = useCallbackArguments();
const { selectTargetData, update } = useUpdateInstance({
  history: false
});

const cIScreenCreator = computed(() => {
  return navInfo.value.userId === userInfo.id;
});
const { dialog } = useDialog();
const input = ref("");
const handleFullScreen = () => {
  dialog({
    DialogProps: {
      title: "全屏编辑",
      width: "80%",
      modalClass: "data-interface-dialog"
    },
    componentProps: {},
    component: dataSqlDialog
  });
};

const selectChange = async () => {
  // emitFilterTrigger(`${selectTargetData.value[0].id}`);
  update();
};

onMounted(() => {
  const dataSource = selectTargetData.value[0].dataSource;
  if (dataSource && Object.keys(dataSource).length > 0) {
    input.value = dataSource.id;
  } else {
    input.value = "";
  }
});
</script>
<style lang="scss" scoped>
.response-wrapper {
  position: relative;
  width: 303px;
  height: 202px;
  .icon-position {
    position: absolute;
    right: 0;
    bottom: 0;
    cursor: pointer;
  }
}
</style>
