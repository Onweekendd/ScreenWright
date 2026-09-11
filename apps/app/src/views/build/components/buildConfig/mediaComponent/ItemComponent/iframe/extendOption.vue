<template>
  <div class="iframe-extend">
    <!-- 当前缺失 isQuote 这个 字段 -->
    <el-form-item :label-width="firstLabelWidth">
      <template #label>
        <span
          >引用平台大屏
          <el-tooltip class="item" effect="dark" placement="left">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p style="width: 200px">备注：引用平台大屏, 目前是仅加载大屏的终端配置</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <el-checkbox v-model="selectTargetData[0].option.isQuote" @change="update" />
    </el-form-item>
    <template v-if="selectTargetData[0].option.isQuote">
      <el-form-item label="大屏选择" :label-width="firstLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.quoteId"
          @change="handleQuoteIdChange"
          fit-input-width
        >
          <el-option v-for="item in displayList" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="大屏版本" :label-width="firstLabelWidth">
        <el-select
          popper-class="sw-select-dropdown"
          v-model="selectTargetData[0].option.quoteVersion"
          @change="update"
        >
          <el-option v-for="item in versionList" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="重新加载" :label-width="firstLabelWidth">
        <template #label>
          <span
            >重新加载
            <el-tooltip class="item" effect="dark" placement="left">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <p style="width: 200px">点击重新加载，更新配置并重新渲染页面内容</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <span class="reloadQuote" @click.stop="getQuoteDetail">重新加载</span>
      </el-form-item>
    </template>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { ElMessage } from "element-plus";
import { cloneDeep } from "lodash-es";

import { getScreenVersionList } from "@/api/version";
import { getScreenList } from "@/api/visual";
import { getQuoteScreenObj } from "@/api/visual";
import Icon from "@/components/Icon/index.vue";
import type { ScreenVersion } from "@/model/Version";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";

import { firstLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const pageId = ref<string | number>("");
const { navInfo } = useLargeScreenInfo();
// const activeObjData = ref<any>(null);
const initObj = async () => {
  if (!("isQuote" in selectTargetData.value[0].option)) {
    selectTargetData.value[0].option["isQuote"] = false;
    update();
    console.log("change isQuote 对象", selectTargetData.value[0]);
  }
};
initObj();

const route = useRoute();

const displayList = ref<any>([]);
const versionList = ref<any>([
  {
    label: "V1",
    value: "1"
  }
]);

const getDisplayList = async (id: number) => {
  displayList.value = [];
  const res = await getScreenList({
    current: 1,
    size: 100,
    name: null,
    groupId: -2, //获取全部应用
    stockType: 1,
    status: true
  });

  if (res.code == 200) {
    const resArray: any = [];
    let allDisplayList = res.result.records
      .map((item) => {
        return {
          value: item.id,
          label: `${item.name}_${item.id}`,
          invitationCode: item.invitationCode,
          terminalEnableArr: JSON.parse(item.detail)?.terminalEnableArr || []
        };
      })
      .slice(0, 50);

    const currentTerminal = allDisplayList.filter(
      (item: any) => item.id != id && Object.keys(item.terminalEnableArr).length
    );

    for (let i = 0; i < currentTerminal.length; i++) {
      const curItem = currentTerminal[i];
      Object.keys(curItem.terminalEnableArr).forEach((key) => {
        resArray.push({
          ...curItem,
          label: `${curItem.terminalEnableArr[key]}_${curItem.label}`,
          value: curItem.value + "_" + key
        });
      });
    }

    displayList.value = resArray;
  }
};

const getQuoteDetail = async () => {
  const { quoteId, quoteVersion } = selectTargetData.value[0].option || {};
  console.log(displayList.value, "displayListvalue");
  let isHasQuoteId = displayList.value.some((item: any) => item.value === quoteId);
  console.log(isHasQuoteId, "isHasQuoteId");

  if (!selectTargetData.value[0] || !quoteId || !quoteVersion) return;
  if (!isHasQuoteId) {
    ElMessage.error("当前选择的大屏不存在，请重新选择");
    // selectTargetData.value[0].option.quoteId = null;
    // selectTargetData.value[0].option.quoteVersion = null;
    const resDetail = setQuoteDetail([]);
    selectTargetData.value[0].option.quoteInfo = resDetail;
    update();
    return;
  }
  const res = await getQuoteScreenObj(
    {
      // 大屏id
      largeScreenId: parseInt(quoteId),
      // 引用面板id
      quoteId: parseInt(quoteId),
      // 是否发布
      status: 0,
      // 大屏版本
      largeVersion: navInfo.value.versionCode || "1",
      // 引用大屏版本
      quoteVersion: quoteVersion || "1"
    },
    false
  );
  console.log(res, "resresres");
  // debugger
  if (res.code == 200) {
    const resDetail = setQuoteDetail(res.result);
    selectTargetData.value[0].option.quoteInfo = resDetail;
    update();
  } else {
    ElMessage.error(res.message || "获取大屏配置失败");
    const resDetail = setQuoteDetail([]);
    selectTargetData.value[0].option.quoteInfo = resDetail;
    // selectTargetData.value[0].option.quoteInfo = {};
    update();
  }
};

const setQuoteDetail = (result: any) => {
  let component: any[] = [];

  if (Array.isArray(result) && result.length === 0) {
    return {
      detail: "",
      component: [],
      dataFilterArr: [],
      id: null
    };
  }
  // 数据处理
  const detail = typeof result.detail === "string" ? JSON.parse(result.detail) : result.detail;
  const layers = typeof result.layers === "string" ? JSON.parse(result.layers) : result.layers; // 图层组件配置集合
  const zIndexMap = detail.zIndexMap || {};
  if (layers.length) {
    layers.forEach((item: any) => {
      const isControl = item.includes(`"title":"终端交互"`);
      if (isControl) component.push(JSON.parse(item));
    });
    component = component.sort((a, b) => {
      const aZ = zIndexMap[a.id] || a.zIndex || 0;
      const bZ = zIndexMap[b.id] || b.zIndex || 0;
      return bZ - aZ;
    });
  }
  // 若不存在终端交互图层，则不做任何操作
  if (!component || !component.length) return;
  console.log(component[0], '"title":"终端交互');
  // const cPanel_obj = cloneDeep(component[0])
  let quoteId = selectTargetData.value[0].option.quoteId;
  const terminalId = typeof quoteId === "string" ? parseInt(quoteId.split("_")[1]) : quoteId;
  let cPanel_obj = cloneDeep(component.find((a) => a.id === terminalId) || component[0]);
  const { width, height } = cPanel_obj.component || {};
  const { enableScroll } = cPanel_obj.option || {};
  const { backgroundColor, backgroundImage, showBackgroundImage, config } = cPanel_obj.panelData[0] || {};
  Object.assign(detail, {
    width,
    height,
    backgroundColor,
    backgroundImage,
    showBackgroundImage,
    enableScroll,
    setTypeOne: true
  });
  component = config.sort((a: any, b: any) => {
    const aZ = zIndexMap[a.id] || a.zIndex || 0;
    const bZ = zIndexMap[b.id] || b.zIndex || 0;
    return bZ - aZ;
  });
  return {
    detail,
    component,
    dataFilterArr: result.dataFilterArr,
    id: result.id
  };
};

const selectVersion = async (id: number, reopen: boolean) => {
  if (!id) return;
  if (typeof id === "string") {
    id = parseInt(id);
  }
  // 清空版本信息
  versionList.value = [];
  const res = await getScreenVersionList(id);
  console.log(res, "getScreenVersionList");
  if (res.code === 200) {
    versionList.value = res.result.map((item: ScreenVersion) => {
      return {
        ...item,
        label: `V${item.versionCode} ${item.versionDesc || "--"}`,
        value: item.versionCode
      };
    });
  }
  // 默认选中第一个
  if (!selectTargetData.value[0].option.quoteVersion) {
    selectTargetData.value[0].option.quoteVersion = versionList.value[0].value;
  }

  if (reopen) {
    await getQuoteDetail();
  }
};
const handleQuoteIdChange = async (val: number | string) => {
  console.log("大屏选择变化", val);
  await selectVersion(parseInt(val as string), true);
  update();
};

// watch(
//   () => selectTargetData.value[0].option.quoteId,
//   (v) => {
//     if (!v) return
//     console.log("大屏选择变化", v)
//     selectVersion(v, true)

//   },
//   { immediate: true }
// )

// watch(
//   () => selectTargetData.value[0],
//   (nv) => {
//     if (nv) {
//       if (nv.data) {
//         if (Array.isArray(nv.data) && nv.data.length) {
//           activeObjData.value = nv.data[0];
//         } else {
//           activeObjData.value = nv.data;
//         }
//       }
//       if (!nv.option.quoteVersion) {
//         getQuoteDetail();
//       }
//     }
//   }
// );
onMounted(async () => {
  pageId.value = Number(route.params.id);
  await getDisplayList(pageId.value);
  // await getQuoteDetail();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");

.reloadQuote {
  height: 26px;
  background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
  padding: 5px 10px;
  font-size: 12px;
  line-height: 12px;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    color: #ffffff;
  }
}
.iframe-extend {
  width: 100%;
  height: 100%;
}
</style>
