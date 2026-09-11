<template>
  <div class="iframe-global">
    <el-form-item label="边距" :label-width="firstLabelWidth">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model.number="selectTargetData[0].option.gridTop"
          bottomLabel="上"
          unit="px"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.gridBottom"
          bottomLabel="下"
          unit="px"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.gridLeft"
          bottomLabel="左"
          unit="px"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.gridRight"
          bottomLabel="右"
          unit="px"
          @change="update"
        />
      </div>
    </el-form-item>
    <el-form-item label="iframe地址" :label-width="firstLabelWidth">
      <sw-input clearable v-model="selectTargetData[0].option.iframeUrl" @change="update" />
    </el-form-item>
    <el-form-item :label-width="firstLabelWidth">
      <template #label>
        <span
          >扩展地址
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p style="width: 200px">若设置了扩展地址，即导出应用部署会优先读取该值作为iframe地址</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <sw-input v-model="selectTargetData[0].option.extendIframeUrl" type="text" @change="update" />
    </el-form-item>
    <el-form-item label="延时加载" :label-width="firstLabelWidth">
      <template #label>
        <span
          >延时加载
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p style="width: 200px">默认为0为不延迟加载</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <sw-input-number v-model.number="selectTargetData[0].option.delayLoading" unit="ms" @change="update" />
    </el-form-item>
    <el-form-item label="隐藏加载条" :label-width="firstLabelWidth">
      <template #label>
        <span
          >隐藏加载条
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p style="width: 200px">备注：只限该平台输出的地址有效</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <el-checkbox v-model="selectTargetData[0].option.hiddenLoading" @change="update" />
    </el-form-item>
    <div class="flex flex-center-between">
      <el-form-item label="滚动" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.frameborder" @change="update" />
      </el-form-item>
      <el-form-item label="滚动条" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.scrolling" @change="update" />
      </el-form-item>
    </div>
    <SwCollapseItem title="额外限制">
      <template #content>
        <div class="flex flex-center-between flex-wrap">
          <el-form-item label="视为同源" :label-width="secondLabelWidth">
            <el-checkbox v-model="selectTargetData[0].option.allowSameOrigin" @change="update" />
          </el-form-item>
          <el-form-item label="上下文加载" :label-width="secondLabelWidth">
            <el-checkbox v-model="selectTargetData[0].option.allowTopNavigation" @change="update" />
          </el-form-item>
          <el-form-item label="表单提交" :label-width="secondLabelWidth">
            <el-checkbox v-model="selectTargetData[0].option.allowForms" @change="update" />
          </el-form-item>
          <el-form-item label="脚本执行" :label-width="secondLabelWidth">
            <el-checkbox v-model="selectTargetData[0].option.allowScripts" @change="update" />
          </el-form-item>
        </div>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="关闭按钮">
      <template #content>
        <el-form-item label="是否启用" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.showClose" @change="update" />
        </el-form-item>
        <el-form-item label="边距" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.closeTop"
              bottomLabel="上"
              unit="px"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.closeBottom"
              bottomLabel="下"
              unit="px"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.closeLeft"
              bottomLabel="左"
              unit="px"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.closeRight"
              bottomLabel="右"
              unit="px"
              @change="update"
            />
          </div>
        </el-form-item>
        <SwCollapseItem title="按钮样式">
          <template #content>
            <el-form-item label="大小" :label-width="secondLabelWidth">
              <sw-input-number v-model.number="selectTargetData[0].option.closeSize" unit="px" @change="update" />
            </el-form-item>
            <el-form-item label="按钮类型" title="按钮类型" :label-width="secondLabelWidth">
              <el-select
                popper-class="sw-select-dropdown"
                v-model="selectTargetData[0].option.closeBtnType"
                placeholder="默认"
                @change="update"
              >
                <el-option v-for="item in btnTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <div v-if="selectTargetData[0].option.closeBtnType === 'image'">
              <el-form-item label="图片" :label-width="secondLabelWidth">
                <sw-upload
                  v-model="selectTargetData[0].option.closeImage"
                  :multiple="false"
                  :showFileList="false"
                  @change="update"
                  @delete="update"
                />
              </el-form-item>
            </div>
            <div v-else>
              <el-form-item label="颜色" :label-width="secondLabelWidth">
                <sw-single-color-picker v-model="selectTargetData[0].option.closeColor" @change="update" />
              </el-form-item>
            </div>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { onMounted, reactive } from "vue";

import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInput from "@/components/SwInput/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import SwUpload from "@/components/SwUpload/index.vue";
import Icon from "@/components/Icon/index.vue";

import { firstLabelWidth, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const btnTypeOptions = reactive([
  { label: "默认", value: "" },
  { label: "图片", value: "image" }
]);

const initData = () => {
  if (selectTargetData.value[0].option.closeSize === 0) {
    selectTargetData.value[0].option.closeSize = 20;
    // selectTargetData.value[0].option.closeBtnType = ""
    update();
  }
};
onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
</style>
