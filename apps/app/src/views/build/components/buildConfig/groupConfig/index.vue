<template>
  <div class="group-config">
    <configTab :tabs="tabs" v-model="active" />
    <configDescription />
    <el-form class="group-config-form" label-width="90px" label-position="left">
      <div v-if="active === GroupTabsEnum.STYLE">
        <configBaseAttrs />
        <configAttrsTab v-model="activeTab" :options="options" />
        <div class="group-config-wrapper">
          <styleConfig v-if="activeTab === GroupOptionsTabsEnum.three3D" />
          <div v-if="activeTab === GroupOptionsTabsEnum.frostedGlass">
            <frostedGlassConfig />
          </div>
        </div>
      </div>
      <!-- <div v-if="active === GroupTabsEnum.FROSTED_GLASS">
        <configBaseAttrs />
        <div class="style-title">毛玻璃</div>
        <div class="group-config-wrapper">1</div>
      </div> -->
      <div v-if="active === GroupTabsEnum.INTERACTIVE" class="group-config-wrapper">
        <loadAnimation :type="updateDataEnum.GROUP" />
      </div>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

// import interactiveConfig from "./interactiveConfig/index.vue"
// import interactiveConfig from "./interactiveConfig.vue"
import loadAnimation from "../attrsRender/components/loadAnimation.vue";
import configAttrsTab from "../components/configAttrsTab/index.vue";
import configBaseAttrs from "../components/configBaseAttrs/index.vue";
import configDescription from "../components/configDescription/index.vue";
import configTab from "../components/configTab/index.vue";
import frostedGlassConfig from "../components/frostedGlassConfig/index.vue";
import { GroupOptionsTabsEnum, GroupTabsEnum, updateDataEnum } from "../type";
import styleConfig from "./styleConfig/index.vue";

const active = ref(GroupTabsEnum.STYLE);

const tabs = ref([
  {
    title: "样式",
    en: "style",
    key: GroupTabsEnum.STYLE,
    icon: "iconfont-style_btn"
  },
  {
    title: "交互",
    en: "interactive",
    key: GroupTabsEnum.INTERACTIVE,
    icon: "iconfont-interactive_btn"
  }
]);
const activeTab = ref(GroupOptionsTabsEnum.three3D);
const options = ref([
  {
    label: "3D转换",
    value: GroupOptionsTabsEnum.three3D
  },
  {
    label: "毛玻璃",
    value: GroupOptionsTabsEnum.frostedGlass
  }
]);
</script>
<style lang="scss" scoped>
.group-config {
  height: 100%;
  .group-config-form {
    height: calc(100% - 144px);
    overflow: auto;
    .style-title {
      font-size: 12px;
      height: 30px;
      line-height: 30px;
      text-align: center;
      color: #ffffff !important;
      background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
      margin-bottom: 20px;
      border-radius: 5px 5px 0px 0px;
    }
  }
  .group-config-wrapper {
    padding: 0 16px;
  }
  :deep(.el-form-item) {
    margin-bottom: 10px;
  }
  :deep(.el-form-item__label) {
    padding: 0 !important;
    color: #b4b7c1 !important;
    font-size: 12px;
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-weight: 400;
  }
}
</style>
