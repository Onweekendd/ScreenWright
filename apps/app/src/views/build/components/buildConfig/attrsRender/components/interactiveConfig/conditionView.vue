<template>
  <div class="config-condition">
    <div class="condition-list" :class="{ active: conditionsLen }">
      <p v-for="item in conditions" :key="item.id" @click.stop="changeValue(item)">
        <span>{{ item.name }}</span>
        <span>></span>
      </p>
      <div class="list-compare" v-if="conditionsLen">
        {{ conditionType === ConditionLogicTypeEnum.One ? "或" : "且" }}
      </div>
    </div>
    <div class="condition-control" @click="addCondition">
      <span>添加条件</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { ConditionLogicTypeEnum } from "@screenwright/types";

interface Condition {
  id: string | number;
  name: string;
}

interface Props {
  conditions?: Condition[];
  conditionType?: ConditionLogicTypeEnum;
}

const props = withDefaults(defineProps<Props>(), {
  conditions: () => [],
  conditionType: ConditionLogicTypeEnum.And
});

const emit = defineEmits<{
  (e: "changeValue", id: string | number): void;
  (e: "addCondition"): void;
}>();

const conditionsLen = computed(() => props.conditions && props.conditions.length > 1);

const changeValue = (info: Condition) => {
  emit("changeValue", info.id);
};

const addCondition = () => {
  emit("addCondition");
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";

.config-condition {
  color: #b4b7c1;
  padding: 15px 15px;
  width: 100% !important;
  background-color: rgba(24, 27, 36, 0.8);
  border: 1px solid #393b4a;
  border-radius: 4px;

  .condition-list {
    position: relative;
    &.active {
      padding-left: 20px;
    }

    & > P {
      background: #2d2f38;
      border: 1px solid #393b4a;
      height: 24px;
      line-height: 22px;
      padding: 0 8px;
      margin-bottom: 12px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &.active::before {
      content: "";
      position: absolute;
      top: 5px;
      bottom: 5px;
      left: 0;
      width: 6px;
      border: 1px solid #454759;
      border-right: none;
    }

    .list-compare {
      width: 20px;
      height: 20px;
      line-height: 18px;
      text-align: center;
      background: #0d0e10;
      border: 1px solid #393b4a;
      border-radius: 1px;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      left: -10px;
    }
  }

  .condition-control {
    line-height: 26px;
    cursor: pointer;
    border: 1px solid #8a56e8;
    border-radius: 4px 4px;
    text-align: center;
    color: #8a56e8;
  }
}
</style>
