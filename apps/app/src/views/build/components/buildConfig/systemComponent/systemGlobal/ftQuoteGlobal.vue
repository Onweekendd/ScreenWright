<template>
  <div class="ft-quote-global">
    <el-form-item :label-width="firstLabelWidth">
      <template #label>
        <span
          >数据分析
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p>启动数据分析，会同步该图层数据到关联知识库，提供给数字人做数据分析等操作</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <el-checkbox v-model="selectTargetData[0].enableDataAnalysis" @change="update" />
    </el-form-item>
    <el-form-item :label-width="firstLabelWidth" label="数据分析名称" v-if="selectTargetData[0].enableDataAnalysis">
      <sw-input v-model="dataAnalysisNameComputed" @change="update" placeholder="请输入数据分析名称" />
    </el-form-item>
    <el-form-item label="启用滚动条" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.enableScroll" @change="update" />
    </el-form-item>
    <el-form-item label="自动轮播" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.autoRotation" @change="update" />
    </el-form-item>
    <template v-if="selectTargetData[0].option.autoRotation">
      <el-form-item label="动画类型" :label-width="firstLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.effectSymbol"
          @change="update"
        >
          <el-option v-for="item in option" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="间隔时长" :label-width="firstLabelWidth">
        <SwInputNumber unit="S" v-model="selectTargetData[0].option.timingFunction" @change="update" />
      </el-form-item>
    </template>

    <SwCollapseItem title="系列" open>
      <template #icon>
        <Icon type="CirclePlus" size="15" @click="handleAddSeries" />
        <Icon type="Delete" size="15" @click="handleDelSeries" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs
          v-model="currentTab"
          v-if="selectTargetData[0].option.displayList"
          :tabs="selectTargetData[0].option.displayList.map((v: any, index: number) => v.name + (index + 1))"
        />
        <div v-for="(item, index) in selectTargetData[0].option.displayList" :key="index">
          <template v-if="`${index}` === status">
            <el-form-item label="大屏选择" :label-width="firstLabelWidth">
              <el-select-v2
                :options="filterDisplayList"
                popper-class="sw-select-dropdown"
                v-model="item.value"
                @change="
                  (val: number) => {
                    handleIdChange(item, val);
                  }
                "
                filterable
              />
            </el-form-item>
            <el-form-item label="大屏版本选择" :label-width="firstLabelWidth" v-if="item.value">
              <el-select-v2
                :options="versionList"
                popper-class="sw-select-dropdown"
                v-model="item.version"
                @change="handleVersionChange"
              />
            </el-form-item>
          </template>
        </div>
      </template>
    </SwCollapseItem>
    <!-- v-if="main.userId === main.visual.userId" -->
    <div class="panelBtn" v-if="isShowEditBtn" @click="handleJumpQuotePanel">编辑引用面板</div>
  </div>
</template>
<script setup lang="ts">
// import { updateLayersAgg } from "@/api/library"
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { ElMessage } from "element-plus";

import { getScreenVersionList } from "@/api/version";
import { getScreenList } from "@/api/visual";
import ScreenwrightSeriesTabs from "@/components/ScreenwrightSeriesTabs/index.vue";
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInput from "@/components/SwInput/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import Icon from "@/components/Icon/index.vue";
import { useUserStore } from "@/store/modules/user";
import { randomId } from "@/utils/utils";
import { getVersionCode } from "@/utils/version";

import { useLargeScreenInfo } from "../../../../useLargeScreenInfo";
import { UpdateHistoryTypeEnum } from "../../../buildRender/hooks/useAction";
import { saveLayersByType } from "../../../buildRender/utils";
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { userInfo } = useUserStore();
const { navInfo } = useLargeScreenInfo();
const { selectTargetData, update } = useUpdateInstance();
const filterDisplayList = ref<Array<{ label: string; value: number }>>([]);
const versionList = ref<Array<{ label: string; value: string }>>([]);
const route = useRoute();
const isShowEditBtn = computed(() => {
  return navInfo.value.userId === userInfo.id;
});
const status = computed(() => {
  if (!selectTargetData.value[0]) {
    return "0";
  }
  return selectTargetData.value[0].status || "0";
});
const option = ref([
  { label: "无", value: "none" },
  { label: "渐隐渐现", value: "opacity" }
]);
const currentTab = ref("大屏1");

// 数据分析名称的 computed 属性
const dataAnalysisNameComputed = computed({
  get() {
    return selectTargetData.value[0]?.dataAnalysisName ?? "";
  },
  set(value) {
    if (selectTargetData.value[0]) {
      selectTargetData.value[0].dataAnalysisName = value;
    }
  }
});

watch(
  () => currentTab.value,
  (nv) => {
    if (nv) {
      const index = parseInt(nv.replace(/[^0-9]/g, ""), 10);
      selectTargetData.value[0].status = (index - 1).toString();
      setVersionList();
      saveLayersByType(selectTargetData.value[0], false, {
        updateHistoryType: UpdateHistoryTypeEnum.SKIP
      });
    }
  }
);

const handleJumpQuotePanel = () => {
  if (selectTargetData.value[0].isLock) {
    ElMessage.error("引用面板已锁定！");
    return;
  }
  if (!selectTargetData.value[0].panelData || selectTargetData.value[0].panelData.length === 0) {
    ElMessage.error("请设置引用面板的大屏！");
    return;
  }
  let currentDisplayList = selectTargetData.value[0].option.displayList[parseInt(status.value)];
  if (currentDisplayList.value === "" || currentDisplayList.version === "") {
    ElMessage.error("请设置引用面板的大屏!");
    return;
  }

  let isDelete = selectTargetData.value[0].panelData.some((v: any) => {
    return v.detail.length === 0;
  });

  if (isDelete) {
    ElMessage.error("引用面板的大屏已被删除，请重新设置！");
    return;
  }

  const { PUBLIC_PATH } = process.env;
  const index = parseInt(selectTargetData.value[0].status);
  const target = selectTargetData.value[0].option.displayList[index];
  const list = JSON.parse(window.localStorage.getItem("versionCodeList") || "[]");
  let currentVersion = getVersionCode();
  let fromPath = `${PUBLIC_PATH}${route.path.substring(1)}`;
  let fromVersion = currentVersion || "1";
  let toPath = `${PUBLIC_PATH}build/${target.value}?version=${target.version}`;
  list.push({
    fromPath,
    toPath,
    fromVersion,
    toVersion: target.version || "1"
  });
  window.localStorage.setItem("versionCodeList", JSON.stringify(list));

  window.location.href = toPath;
};

const handleAddSeries = async () => {
  const json = {
    id: "quote_" + randomId(),
    value: "",
    name: "大屏",
    version: ""
  };
  selectTargetData.value[0].option.displayList.push(json);
  currentTab.value = "大屏" + selectTargetData.value[0].option.displayList.length;
  selectTargetData.value[0].status = selectTargetData.value[0].option.displayList.length - 1 + "";
  await setVersionList();
  update();
};

const handleVersionChange = () => {
  selectTargetData.value[0].option.refreshKey = !selectTargetData.value[0].option.refreshKey;
  update();
};

const handleDelSeries = () => {
  if (selectTargetData.value[0].option.displayList.length > 1) {
    const index = parseInt(status.value);
    const target = selectTargetData.value[0].option.displayList[index];
    const id = target.value || "";
    selectTargetData.value[0].option.displayList.splice(index, 1);
    if (index === 0) {
      currentTab.value = "大屏1";
      selectTargetData.value[0].status = "0";
    } else {
      currentTab.value = "大屏" + index;
      selectTargetData.value[0].status = index - 1 + "";
    }
    setVersionList();

    selectTargetData.value[0].panelData = selectTargetData.value[0].panelData.filter((v: any) => v.id !== id);
    selectTargetData.value[0].option.refreshKey++;
    update();
  }
};
const handleIdChange = async (item: any, val: number) => {
  console.log(val, "valvalval", item);
  await getScreenVersionListApi(val);
  if (versionList.value && versionList.value.length > 0) {
    item.version = versionList.value[0].value;
  }
  selectTargetData.value[0].option.refreshKey = !selectTargetData.value[0].option.refreshKey;

  update();
};

const setVersionList = async () => {
  if (!selectTargetData.value[0] || !selectTargetData.value[0].option.displayList) {
    versionList.value = [];
    return;
  }
  const index = parseInt(status.value);
  console.log(index, "indexindex");
  const currentDisplay = selectTargetData.value[0].option.displayList[index];
  console.log(currentDisplay, "currentDisplaycurrentDisplay");
  if (currentDisplay.value) {
    await getScreenVersionListApi(currentDisplay.value);
  } else {
    versionList.value = [];
  }
};

const getScreenVersionListApi = async (id: number | string) => {
  const res = await getScreenVersionList(id);
  if (res.success) {
    versionList.value = res.result.map((item) => {
      return {
        ...item,
        label: `V${item.versionCode} ${item.versionDesc || "--"}`,
        value: item.versionCode
      };
    });
  } else {
    versionList.value = [];
  }
};

const getScreenListApi = async () => {
  const res = await getScreenList({ current: 1, size: 9999, groupId: -2 });
  const id = route.params.id;
  if (res.success) {
    filterDisplayList.value = res.result.records
      .map((item) => {
        return {
          value: item.id,
          label: `${item.name}_${item.id}`,
          invitationCode: item.invitationCode,
          terminalEnableArr: JSON.parse(item.detail)?.terminalEnableArr || []
        };
      })
      .filter((item) => `${item.value}` != `${id}`);
  } else {
    filterDisplayList.value = [];
  }
};
onMounted(async () => {
  if (!selectTargetData.value[0]) {
    return;
  }
  await getScreenListApi();
  await setVersionList();
  currentTab.value = "大屏" + (parseInt(status.value) + 1);
  if (selectTargetData.value[0]) {
    selectTargetData.value[0].status = selectTargetData.value[0] ? selectTargetData.value[0].status || "0" : "0";
  }
});
// onActivated(() => {
//   // currentTab.value = ""
//   // nextTick(() => {
//   //   currentTab.value = "大屏" + (parseInt(status.value) + 1)
//   //   console.log(currentTab.value, " currentTab.value")
//   // })
// })
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
.panelBtn {
  width: 302px;
  height: 40px;
  line-height: 40px;
  margin: 5px auto;
  text-align: center;
  background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
  border-radius: 5px 5px;
  cursor: pointer;
  color: #fff;
  font-size: 12px;
}
</style>
