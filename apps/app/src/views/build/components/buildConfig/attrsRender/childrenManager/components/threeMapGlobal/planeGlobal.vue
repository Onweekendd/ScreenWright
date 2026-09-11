<!-- 面片的全局 -->
<template>
  <div class="plane-global">
    <SwCollapseItem title="面片管理" open>
      <template #icon>
        <Icon type="CirclePlus" @click="handlePlaneChange('add')" />
        <Icon type="Delete" @click="handlePlaneChange('delete')" />
      </template>
      <template #content>
        <template v-if="planeList.length > 0">
          <ScreenwrightSeriesTabs v-model="planeTabs" :tabs="planeList" nameKey="name" />
          <!-- <el-form-item label="面片名称" :label-width="secondLabelWidth">
            <SwInput v-model="currentPlane.name" @change="update" />
          </el-form-item> -->
        </template>
        <div v-else class="empty-list">列表为空，请点击 + 添加面片</div>
      </template>
    </SwCollapseItem>

    <template v-if="currentPlane">
      <el-form-item label="启用" :label-width="secondLabelWidth">
        <el-checkbox v-model="currentPlane.visible" @change="update" />
      </el-form-item>
      <SwCollapseItem title="物体设置" open>
        <template #content>
          <el-form-item label="坐标系统" :label-width="secondLabelWidth">
            <sw-radio
              v-model="currentPlane.coordinateSystem"
              direction="row"
              :option="coordinateSystemList"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="尺寸" :label-width="secondLabelWidth">
            <div class="multi-input">
              <SwInputNumber :modelValue="currentPlane.sizeWidth" @update:modelValue="handleWidthChange" :min="0" />
              <span class="label">宽度</span>
              <div class="lock-icon" @click="isRatioLocked = !isRatioLocked" :class="{ locked: isRatioLocked }">
                <Icon :type="isRatioLocked ? 'Lock' : 'Unlock'" />
              </div>
              <SwInputNumber :modelValue="currentPlane.sizeHeight" @update:modelValue="handleHeightChange" :min="0" />
              <span class="label">高度</span>
            </div>
          </el-form-item>
          <el-form-item label="位移" :label-width="secondLabelWidth">
            <div class="multi-input">
              <SwInputNumber v-model="currentPlane.position[0]" @change="update" />
              <span class="label">X</span>
              <SwInputNumber v-model="currentPlane.position[1]" @change="update" />
              <span class="label">Y</span>
              <SwInputNumber v-model="currentPlane.position[2]" @change="update" />
              <span class="label">Z</span>
            </div>
          </el-form-item>
          <SwCollapseItem title="旋转" :label-width="secondLabelWidth">
            <template #content>
              <el-form-item label="X" :label-width="thirdLabelWidth">
                <SwSlider v-model="currentPlane.rotation[0]" :min="-360" :max="360" @change="update" />
              </el-form-item>
              <el-form-item label="Y" :label-width="thirdLabelWidth">
                <SwSlider v-model="currentPlane.rotation[1]" :min="-360" :max="360" @change="update" />
              </el-form-item>
              <el-form-item label="Z" :label-width="thirdLabelWidth">
                <SwSlider v-model="currentPlane.rotation[2]" :min="-360" :max="360" @change="update" />
              </el-form-item>
            </template>
          </SwCollapseItem>
        </template>
      </SwCollapseItem>

      <SwCollapseItem title="样式" open>
        <template #content>
          <el-form-item label="填充模式" :label-width="secondLabelWidth">
            <el-select popper-class="sw-select-dropdown" v-model="currentPlane.fillMode" @change="update">
              <el-option label="单一颜色" value="color" />
              <el-option label="图片" value="picture" />
            </el-select>
          </el-form-item>

          <template v-if="currentPlane.fillMode === 'picture'">
            <el-form-item label="样式类型" :label-width="secondLabelWidth">
              <el-select popper-class="sw-select-dropdown" v-model="styleType" @change="update">
                <el-option v-for="item in styleOptions" :key="item.value" :label="item.label" :value="item.value">
                  <div class="style-option">
                    <!-- <img
                      :src="setMinioUrl(item.value)"
                      class="style-thumb"
                      v-if="item.value && item.value !== 'custom'"
                    /> -->
                    <!-- <div class="style-thumb custom-thumb">
                      <span>+</span>
                    </div> -->
                    <span class="style-label">{{ item.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="来源" :label-width="secondLabelWidth">
              <div class="texture-upload-wrapper">
                <SwUpload
                  v-if="styleType === 'custom'"
                  v-model="currentPlane.textureUrl"
                  :fileType="FileType.imgAndVideo"
                  :multiple="false"
                  :showFileList="false"
                  @change="update"
                  @delete="update"
                />
                <div class="preset-preview" v-else>
                  <img :src="setMinioUrl(currentPlane.textureUrl)" class="preview-img" />
                </div>
                <div
                  v-if="currentPlane.textureUrl"
                  class="preview-icon-btn"
                  @click="handlePreview(currentPlane.textureUrl)"
                >
                  <Icon type="View" size="14" />
                </div>
              </div>
            </el-form-item>

            <!-- <el-form-item label="贴图重复" :label-width="secondLabelWidth">
              <SwInputNumber v-model="currentChildrenItem.option.textureRepeat" @change="update" :min="1" />
            </el-form-item> -->

            <el-form-item label="贴图平铺" :label-width="secondLabelWidth">
              <div style="display: flex; gap: 8px">
                <SwInputNumber
                  v-model="currentPlane.uvScaleX"
                  :step="0.1"
                  :min="0.1"
                  @change="update"
                  placeholder="X"
                />
                <SwInputNumber
                  v-model="currentPlane.uvScaleY"
                  :step="0.1"
                  :min="0.1"
                  @change="update"
                  placeholder="Y"
                />
              </div>
            </el-form-item>
            <el-form-item label="贴图偏移" :label-width="secondLabelWidth">
              <div style="display: flex; gap: 8px">
                <SwInputNumber v-model="currentPlane.uvOffsetX" :step="0.1" @change="update" placeholder="X" />
                <SwInputNumber v-model="currentPlane.uvOffsetY" :step="0.1" @change="update" placeholder="Y" />
              </div>
            </el-form-item>
            <el-form-item label="贴图旋转" :label-width="secondLabelWidth">
              <SwInputNumber v-model="currentPlane.uvRotation" @change="update" />
            </el-form-item>
          </template>

          <el-form-item label="颜色" :label-width="secondLabelWidth">
            <SwSingleColorPicker v-model="currentPlane.tintColor" @change="update" />
          </el-form-item>

          <el-form-item label="双面渲染" :label-width="secondLabelWidth">
            <el-checkbox v-model="currentPlane.doubleSide" @change="update" />
          </el-form-item>

          <!-- <el-form-item label="深度测试" :label-width="secondLabelWidth">
            <el-checkbox v-model="currentChildrenItem.option.depthTest" @change="update" />
          </el-form-item> -->

          <el-form-item label="支持透明" :label-width="secondLabelWidth">
            <el-checkbox v-model="currentPlane.transparent" @change="update" />
          </el-form-item>

          <el-form-item label="混合模式" :label-width="secondLabelWidth">
            <el-select popper-class="sw-select-dropdown" v-model="currentPlane.blending" @change="update">
              <el-option v-for="item in blendingOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>

          <!-- <el-form-item label="深度写入" :label-width="secondLabelWidth">
            <el-checkbox v-model="currentChildrenItem.option.depthWrite" @change="update" />
          </el-form-item> -->

          <el-form-item label="透明度" :label-width="secondLabelWidth">
            <SwSlider v-model="currentPlane.opacity" :min="0" :max="100" :step="1" @change="update" />
          </el-form-item>

          <el-form-item label="渲染层级" :label-width="secondLabelWidth">
            <SwInputNumber v-model="currentPlane.renderOrder" @change="update" :step="1" :max="10" />
          </el-form-item>
        </template>
      </SwCollapseItem>

      <SwCollapseItem title="动画" open>
        <template #content>
          <el-form-item label="动画类型" :label-width="secondLabelWidth">
            <el-select popper-class="sw-select-dropdown" v-model="currentPlane.animationType" @change="update">
              <el-option label="无" value="none" />
              <el-option label="中心旋转" value="rotate" />
              <el-option label="中心扩散" value="spread" />
              <!-- <el-option label="自定义动画" value="custom" /> -->
            </el-select>
          </el-form-item>

          <template v-if="currentPlane.animationType === 'rotate'">
            <el-form-item label="旋转速度" :label-width="secondLabelWidth">
              <SwInputNumber v-model="currentPlane.rotateSpeed" @change="update" :min="0" :step="0.1" />
            </el-form-item>
            <el-form-item label="旋转方向" :label-width="secondLabelWidth">
              <el-select popper-class="sw-select-dropdown" v-model="currentPlane.rotateDirection" @change="update">
                <el-option label="顺时针" :value="-1" />
                <el-option label="逆时针" :value="1" />
              </el-select>
            </el-form-item>
          </template>

          <template v-if="currentPlane.animationType === 'spread'">
            <el-form-item label="扩散速度" :label-width="secondLabelWidth">
              <SwInputNumber v-model="currentPlane.spreadSpeed" @change="update" :min="0" :step="0.1" />
            </el-form-item>
            <el-form-item label="扩散间隔" :label-width="secondLabelWidth">
              <SwInputNumber v-model="currentPlane.spreadInterval" @change="update" :min="0" :step="0.1" />
            </el-form-item>
          </template>
        </template>
      </SwCollapseItem>
    </template>

    <el-dialog
      v-model="previewVisible"
      title="图片预览"
      width="fit-content"
      append-to-body
      destroy-on-close
      class="plane-image-preview-dialog"
    >
      <div class="preview-dialog-content">
        <img :src="previewUrl" alt="preview" />
      </div>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import { cloneDeep } from "@/components/ScreenwrightSceneComponent/utils";
import ScreenwrightSeriesTabs from "@/components/ScreenwrightSeriesTabs/index.vue";
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
// import SwInput from "@/components/SwInput/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";
import { FileType } from "@/components/SwUpload/SwUpload";
import SwUpload from "@/components/SwUpload/index.vue";
import Icon from "@/components/Icon/index.vue";
import { setMinioUrl } from "@/utils/config";

import { secondLabelWidth, thirdLabelWidth } from "../../../../constants";
import { useChildrenDrawer } from "../../useChildrenDrawer";

const { currentChildrenItem, update } = useChildrenDrawer();

const previewVisible = ref(false);
const previewUrl = ref("");

const handlePreview = (url: string) => {
  if (!url) return;
  previewUrl.value = setMinioUrl(url);
  previewVisible.value = true;
};

// 宽高比例锁
const isRatioLocked = ref(true);

const resizePlane = (type: "width" | "height", val?: string | number) => {
  if (!currentPlane.value || val === undefined) return;

  const plane = currentPlane.value;
  const num = +val;
  if (Number.isNaN(num)) return;

  const isWidth = type === "width";
  const base = isWidth ? plane.sizeWidth : plane.sizeHeight;

  if (isRatioLocked.value && base > 0) {
    const other = isWidth ? "sizeHeight" : "sizeWidth";
    plane[other] = +(plane[other] * (num / base)).toFixed(2);
  }

  plane[isWidth ? "sizeWidth" : "sizeHeight"] = num;
  update();
};

const handleWidthChange = (val: string | number | undefined) => {
  resizePlane("width", val);
};

const handleHeightChange = (val: string | number | undefined) => {
  resizePlane("height", val);
};

// 多面片管理
const planeTabs = ref("面片1");

const planeList = computed(() => {
  return currentChildrenItem.value?.option?.planeList || [];
});

const initData = () => {
  if (!currentChildrenItem.value?.option) return;
  const opt = currentChildrenItem.value.option;
  let changed = false;

  // 兼容旧格式：将现有参数转入第一个面片项
  if (!opt.planeList && (opt.sizeWidth !== undefined || opt.textureUrl !== undefined)) {
    console.log("Migrating plane to list format");
    const firstPlane = {
      name: "面片1",
      id: "plane_" + Date.now(),
      coordinateSystem: opt.coordinateSystem || "3D",
      sizeWidth: opt.sizeWidth || 240,
      sizeHeight: opt.sizeHeight || 240,
      position: opt.position || [0, 0, 0],
      rotation: opt.rotation || [0, 0, 0],
      fillMode: opt.fillMode || "picture",
      textureUrl: opt.textureUrl || "",
      tintColor: opt.tintColor || "#ffffff",
      tintOpacity: opt.tintOpacity || 100,
      doubleSide: opt.doubleSide ?? true,
      depthTest: opt.depthTest ?? true,
      transparent: opt.transparent ?? true,
      blending: opt.blending || "NormalBlending",
      depthWrite: opt.depthWrite ?? false,
      opacity: opt.opacity || 100,
      renderOrder: opt.renderOrder || 10,
      animationType: opt.animationType || "none",
      rotateSpeed: opt.rotateSpeed || 0.5,
      rotateDirection: opt.rotateDirection || 1,
      spreadSpeed: opt.spreadSpeed || 0.5,
      spreadInterval: opt.spreadInterval || 1,
      uvScaleX: opt.uvScaleX || 1,
      uvScaleY: opt.uvScaleY || 1,
      uvOffsetX: opt.uvOffsetX || 0,
      uvOffsetY: opt.uvOffsetY || 0,
      uvRotation: opt.uvRotation || 0
    };
    opt.planeList = [firstPlane];
    changed = true;
  }

  // 确保列表中的项都有默认值
  if (opt.planeList) {
    opt.planeList.forEach((p: any) => {
      const defaults: any = {
        visible: true,
        coordinateSystem: "3D",
        sizeWidth: 240,
        sizeHeight: 240,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        fillMode: "color",
        tintColor: "#ffffff",
        tintOpacity: 100,
        doubleSide: true,
        depthTest: true,
        transparent: true,
        blending: "NormalBlending",
        depthWrite: false,
        opacity: 100,
        renderOrder: 300,
        animationType: "none",
        rotateSpeed: 0.5,
        rotateDirection: 1,
        spreadSpeed: 0.5,
        spreadInterval: 0,
        uvScaleX: 1,
        uvScaleY: 1,
        uvOffsetX: 0,
        uvOffsetY: 0,
        uvRotation: 0
      };

      Object.keys(defaults).forEach((key) => {
        if (p[key] === undefined) {
          p[key] = defaults[key];
          changed = true;
        }
      });
    });
  }

  if (changed) {
    update();
  }

  // 确保 planeTabs 初始化为某个存在的 ID
  if (opt.planeList && opt.planeList.length > 0) {
    const exists = opt.planeList.some((p: any) => p.name === planeTabs.value);
    if (!exists) {
      planeTabs.value = opt.planeList[0].name;
    }
  }
};

watch(
  () => currentChildrenItem.value,
  () => {
    initData();
  },
  { immediate: true, deep: true } // Added deep: true to watch for changes within the object
);

const currentPlane = computed(() => {
  const list = planeList.value;
  const name = planeTabs.value;
  const item = list.find((p: any) => p.name === name);
  return item || list[0];
});

const handlePlaneChange = (type: "add" | "delete") => {
  const list = planeList.value;
  if (type === "add") {
    // 找出当前最大的数字编号，确保新名称唯一
    let maxNum = 0;
    list.forEach((p: any) => {
      const match = p.name.match(/面片(\d+)/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    });
    const newName = `面片${maxNum + 1}`;

    const newItem = cloneDeep(list.length > 0 ? list[list.length - 1] : {});
    newItem.name = newName;
    newItem.id = "plane_" + Date.now();
    list.push(newItem);
    planeTabs.value = newItem.name;
  } else if (type === "delete" && list.length > 1) {
    const index = list.findIndex((p: any) => p.name === planeTabs.value);
    if (index !== -1) {
      list.splice(index, 1);
      const nextIndex = Math.max(0, index - 1);
      planeTabs.value = list[nextIndex].name;
    }
  }
  update();
};

const styleType = computed({
  get: () => {
    if (!currentPlane.value) return "custom";
    const url = currentPlane.value.textureUrl;
    if (!url) return "custom";
    const isPreset = styleOptions.value.some((opt) => opt.value === url && opt.value !== "custom");
    return isPreset ? url : "custom";
  },
  set: (val) => {
    if (!currentPlane.value) return;
    if (val === "custom") {
      const url = currentPlane.value.textureUrl;
      const isPreset = styleOptions.value.some((opt) => opt.value === url && opt.value !== "custom");
      if (isPreset) {
        currentPlane.value.textureUrl = "";
      }
    } else {
      currentPlane.value.textureUrl = val;
    }
  }
});

const blendingOptions = ref([
  { label: "正常", value: "NormalBlending" },
  { label: "相加", value: "AdditiveBlending" },
  { label: "相减", value: "SubtractiveBlending" },
  { label: "相乘", value: "MultiplyBlending" }
]);

const styleOptions = ref([
  { label: "圆弧底图1", value: "version-test/assets/scene/echartGlMap/plane/plane12.png" },
  { label: "圆弧底图2", value: "version-test/assets/scene/echartGlMap/plane/plane5.png" },
  { label: "圆弧底图3", value: "version-test/assets/scene/echartGlMap/plane/plane6.png" },
  { label: "圆弧底图4", value: "version-test/assets/scene/echartGlMap/plane/plane8.png" },
  { label: "圆弧底图5", value: "version-test/assets/scene/echartGlMap/plane/plane9.png" },
  { label: "圆弧底图6", value: "version-test/assets/scene/echartGlMap/plane/plane4.png" },
  { label: "渐变光圈1", value: "version-test/assets/scene/echartGlMap/plane/plane13.png" },
  { label: "渐变光晕1", value: "version-test/assets/scene/echartGlMap/plane/plane2.png" },
  { label: "渐变光晕2", value: "version-test/assets/scene/echartGlMap/plane/plane10.png" },
  { label: "渐变光晕3", value: "version-test/assets/scene/echartGlMap/plane/plane1.png" },
  { label: "坐标系1", value: "version-test/assets/scene/echartGlMap/plane/plane3.png" },
  { label: "坐标系2", value: "version-test/assets/scene/echartGlMap/plane/plane11.png" },
  { label: "点阵图1", value: "version-test/assets/scene/echartGlMap/plane/plane7.png" },
  { label: "自定义", value: "custom" }
]);

const coordinateSystemList = ref([
  { label: "3D", value: "3D" },
  { label: "GIS", value: "GIS" }
]);

// 初始化默认值
onMounted(() => {
  initData();
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

.plane-global {
  padding: 0 16px;
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  .multi-input {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;

    :deep(.sw-input-number) {
      flex: 1;
    }

    .label {
      color: rgba(255, 255, 255, 0.45);
      font-size: 12px;
      white-space: nowrap;
    }

    .lock-icon {
      width: 24px;
      height: 24px;
      color: rgba(255, 255, 255, 0.45);
      cursor: pointer;

      &.locked {
        color: #6132e4;
      }
    }
  }

  .empty-list {
    padding: 20px;
    text-align: center;
    color: rgba(255, 255, 255, 0.45);
    font-size: 13px;
  }

  .style-option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px 0;

    .style-thumb {
      display: block;
      width: 100px;
      height: 100px;
      object-fit: contain;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      flex-shrink: 0;

      &.custom-thumb {
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.45);
        font-size: 24px;
        border-style: dashed;
      }
    }

    .style-label {
      color: #fff;
      font-size: 13px;
    }
  }

  :deep(.el-select-dropdown__item) {
    height: auto;
    line-height: 1.2;
    padding: 2px 12px;
  }

  .preset-preview {
    width: 200px;
    height: 100px;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    .preview-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .texture-upload-wrapper {
    position: relative;
    width: 100%;

    .preview-icon-btn {
      position: absolute;
      right: 8px;
      top: 8px;
      width: 24px;
      height: 24px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #fff;
      z-index: 10;
      transition: all 0.2s;

      &:hover {
        background: #642cff;
      }
    }
  }
}
</style>

<style>
.plane-image-preview-dialog {
  background-color: #2c2c2c;
  border: 1px solid rgba(255, 255, 255, 0.1);

  .el-dialog__header {
    .el-dialog__title {
      color: #fff;
      font-size: 16px;
    }
    .el-dialog__headerbtn {
      .el-dialog__close {
        color: #fff;
        &:hover {
          color: #642cff;
        }
      }
    }
  }

  .preview-dialog-content {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 200px;

    img {
      max-width: 800px;
      max-height: 600px;
      object-fit: contain;
    }
  }
}
</style>
