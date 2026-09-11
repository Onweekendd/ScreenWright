<template>
  <div class="upload-list" v-if="modelValue.length > 0">
    <div class="upload-list-header">
      <Icon type="Plus" size="14" class="plus-icon" @click="handleClick" />
      <Icon type="Delete" size="14" @click="handleClear" />
    </div>
    <div class="upload-list-wrapper">
      <div v-for="item in model" :key="item.url" class="upload-list-item flex flex-align-center flex-justify-between">
        <Icon type="Document" size="14" />
        <div class="upload-list-item-right">
          <Icon class="success-icon" type="CircleCheck" size="14" color="#67C23A" />
          <Icon class="close-icon" type="Close" size="14" @click="handleDelete(item)" />
        </div>
      </div>
    </div>
  </div>

  <div class="upload-box flex flex-center" v-else>
    <el-button size="small" @click="handleClick"> 点击上传 </el-button>
  </div>
</template>
<script setup lang="ts">
import { useRoute } from "vue-router";
import { useFileDialog, useVModel } from "@vueuse/core";

import Icon from "@editor/base/Icon/index.vue";
import { uploadSceneImage } from "@screenwright/composables";

const route = useRoute();
interface Props {
  modelValue: Array<{
    url: string;
  }>;
}

const props = defineProps<Props>();

const emit = defineEmits(["update:modelValue", "change"]);
const model = useVModel(props, "modelValue", emit);

const { open, onChange } = useFileDialog({
  accept: "image/*"
});
const handleClick = () => {
  open();
};
onChange(async (files) => {
  if (!files) {
    return;
  }
  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const largeId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;
    const res = await uploadSceneImage(file as File, 4, { largeId, applicationCode: "BI" });
    if (res?.url) {
      model.value.push({ url: res.url });
      emit("change", model.value);
    } else {
      console.error("上传失败");
    }
  }
});

const handleDelete = (item: { url: string }) => {
  const index = model.value.findIndex((i) => i.url === item.url);
  if (index !== -1) {
    model.value.splice(index, 1);
    console.log(model.value, "model.value");
    emit("change", model.value);
  }
};

const handleClear = () => {
  model.value = [];
  emit("change", []);
};
</script>
<style lang="scss" scoped>
.upload-box,
.upload-list {
  width: 99%;
  height: 103px;
  //   text-align: center;
  //   line-height: 103px;
  background: #1a1e27;
  border-radius: 4px;
  border: 1px solid #333543;
  &:hover {
    border-color: #642cff;
  }
  :deep(.el-button) {
    width: 70px;
    height: 25px;
    background-image: -webkit-gradient(linear, left top, left bottom, from(#8b58e7), to(#642cff));
    background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    border-color: transparent;
    border-radius: 4px;
    text-align: center;
    padding: 0 !important;
    > span {
      color: #ffffff !important;
      font-size: 12px;
      font-family:
        Source Han Sans CN-Normal,
        Source Han Sans CN !important;
    }
  }
}
.upload-list {
  .upload-list-header {
    cursor: pointer;
    text-align: right;
    padding-right: 6px;
    .plus-icon {
      margin-right: 4px;
    }
  }
  .upload-list-wrapper {
    height: calc(100% - 32px);
    overflow-y: auto;
  }
  .upload-list-item {
    cursor: pointer;
    height: 28px;
    line-height: 28px;
    padding: 0 5px;
    .close-icon {
      display: none;
    }
    &:hover {
      background-color: #3d404c;
      .success-icon {
        display: none;
      }
      .close-icon {
        display: inline-block;
      }
    }
  }
}
</style>
