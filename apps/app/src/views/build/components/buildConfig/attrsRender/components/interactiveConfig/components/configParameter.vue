<template>
  <div class="config-parameter">
    <template v-for="item in paramArr" :key="item.label">
      <div v-if="item.type === 'string'">
        <span>{{ item.label }}</span>
        <el-input size="default" v-model="item.value" :placeholder="item.placeholder" />
      </div>
      <div v-if="item.type === 'number'">
        <span>{{ item.label }}</span>
        <sw-input-number
          v-model="item.value"
          size="default"
          :unit="item.extend.unit || ''"
          :min="item.extend.range ? item.extend.range[0] : -10000"
          :max="item.extend.range ? item.extend.range[1] : 10000"
          :controls="false"
          style="width: 100%"
        />
      </div>
      <div v-if="item.type === 'color'">
        <span>{{ item.label }}</span>
        <el-color-picker size="default" :show-alpha="true" v-model="item.value" />
      </div>
      <div v-if="item.type === 'boolean'">
        <span>{{ item.label }}</span>
        <el-radio-group v-model="item.value">
          <el-radio :label="true">是</el-radio>
          <el-radio :label="false">否</el-radio>
        </el-radio-group>
      </div>
      <div v-if="item.type === 'select'">
        <span>{{ item.label }}</span>
        <el-select
          size="default"
          v-model="item.value"
          :placeholder="item.placeholder"
          popper-class="sw-select-dropdown"
        >
          <el-option
            v-for="citem in item.options"
            :key="
              typeof citem.value === 'string' || typeof citem.value === 'number' ? citem.value : String(citem.value)
            "
            :label="citem.label"
            :value="citem.value"
          />
        </el-select>
      </div>
      <div v-if="item.type === 'object'">
        <span>{{ item.label }}</span>
        <el-input type="textarea" autosize resize="none" v-model="item.value" :placeholder="item.placeholder" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";

interface ParamField {
  label: string;
  value?: any;
  type: "string" | "number" | "color" | "select" | "boolean" | "object";
  options?: Array<{ label: string; value: string | number | boolean }>;
  option?: any;
  extend?: {
    unit?: string;
    range?: [number, number];
  };
  placeholder?: string;
}

interface ParamItem {
  label: string;
  value: any;
  type: string;
  option: any;
  options?: Array<{ label: string; value: string | number | boolean }>;
  extend: Record<string, any>;
  placeholder?: string;
}

type Parameter = Record<string, any>;

const props = defineProps({
  parameter: {
    type: Object as () => Parameter,
    required: false,
    default: () => ({})
  },
  paramFields: {
    type: Array as () => ParamField[],
    default: () => [
      { label: "name", value: "名称", type: "string" },
      { label: "value", value: 10, type: "number" },
      { label: "color", value: "rgba(255,255,255,1)", type: "color" },
      { label: "option", value: "110", type: "select", options: [{ label: "默认", value: "110" }] },
      { label: "boolean", value: true, type: "boolean" },
      { label: "object", value: '{"x":1, "y":1}', type: "object" }
    ]
  }
});

const emit = defineEmits(["change"]);

const paramArr = ref<ParamItem[]>([]);

const setParamArr = () => {
  const parameterCopy = { ...props.parameter };
  const values = Object.values(parameterCopy);
  paramArr.value =
    Object.keys(parameterCopy).map((field, i) => {
      const curParam = props.paramFields.find((a) => a.label === field) || ({} as ParamField);
      return {
        label: field,
        value: values[i] ?? curParam?.value ?? "",
        type: curParam?.type ?? "string",
        option: curParam?.option ?? null,
        options: curParam?.options ?? [],
        extend: curParam?.extend ?? {},
        placeholder: curParam?.placeholder
      };
    }) || [];
};

watch(
  () => paramArr.value,
  (val) => {
    if (!val || !val.length) return;

    // 创建参数的副本以避免直接修改prop
    const updatedParameter = { ...props.parameter };
    let hasChanges = false;

    for (const item of val) {
      if (item.value != updatedParameter[item.label]) {
        updatedParameter[item.label] = item.value;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      emit("change", updatedParameter);
      // 不要在这里调用setParamArr，避免无限循环
    }
  },
  { deep: true }
);

onMounted(() => {
  setParamArr();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";

.config-parameter {
  color: #b4b7c1;
  & > div {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 5px 0;
    span {
      width: 100px;
      text-align: right;
      padding: 0 8px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .el-input,
    .el-select,
    .el-input-number,
    .el-color-picker,
    .el-radio-group {
      width: 100%;
    }
    .el-radio {
      width: fit-content;
      display: inline-block;
    }
  }
  :deep(.inputBox) {
    .unit {
      top: 10%;
    }
  }
}
</style>
