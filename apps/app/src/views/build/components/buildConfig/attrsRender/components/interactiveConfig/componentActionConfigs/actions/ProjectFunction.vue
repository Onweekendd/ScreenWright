<template>
  <div v-if="action">
    <el-form-item label="项目指令" :label-width="85">
      <configSelect :option="projectFuncList" v-model="action.projectFunName" @change="update" />
    </el-form-item>
    <el-form-item label="参数类型" :label-width="85">
      <configSelect field="parameterType" v-model="action.projectParamType" @change="update" />
    </el-form-item>
    <template v-if="action.projectParamType == 'custom'">
      <el-form-item label="参数配置" :label-width="85">
        <div class="format-editor">
          <MonacoEditor v-model="action.projectParamCode" type="javascript" @change="update" />
        </div>
      </el-form-item>
    </template>
    <template v-if="action.projectParamType == 'default'">
      <sw-collapse-item title="参数配置" class="project-parameter">
        <template #content>
          <configParameter
            :parameter="action.projectParamValue"
            :paramFields="action.projectParamList"
            @change="update"
          />
        </template>
      </sw-collapse-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import { extractComponentId } from "@/utils/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import configParameter from "../../components/configParameter.vue";
import ConfigSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
const { globalComponentMap } = useGlobalComponentData();

// 项目模板API
const projectFuncList = computed(() => {
  const cptIds = action.value?.component;
  const actionObj = globalComponentMap.value.get(`${extractComponentId(cptIds[0])}`);
  return actionObj ? actionObj.option.funcList : [];
});
</script>
