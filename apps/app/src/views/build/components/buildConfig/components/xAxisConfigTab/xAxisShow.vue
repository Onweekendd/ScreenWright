<template>
  <div class="xAxis-show">
    <el-form-item label="启用" label-width="100">
      <el-checkbox v-model="show" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { useGenericAttrs } from "@screenwright/material/chart";

import { useUpdateInstance } from "../../useUpdateInstance";
import { XAxisType } from "./type";

const { update } = useUpdateInstance();
interface XAxisShowProps {
  type: XAxisType;
}
const props = defineProps<XAxisShowProps>();

interface keyAttrs {
  show: string;
}
const mapTypeToAttrs: Record<XAxisType, keyAttrs> = {
  [XAxisType.X]: {
    show: "xAxisShow"
  },
  [XAxisType.Y]: {
    show: "yAxisShow"
  },
  [XAxisType.Y_L]: {
    show: "lyAxisShow"
  },
  [XAxisType.Y_R]: {
    show: "ryAxisShow"
  },
  [XAxisType.X_L]: {
    show: "lxAxisShow"
  },
  [XAxisType.X_R]: {
    show: "rxAxisShow"
  }
};

const { show } = useGenericAttrs(props, mapTypeToAttrs);
</script>
