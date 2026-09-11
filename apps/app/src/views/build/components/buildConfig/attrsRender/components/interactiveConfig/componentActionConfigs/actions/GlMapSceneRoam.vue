<template>
  <div>
    <el-form-item label="漫游场景" :label-width="85">
      <el-select
        popper-class="sw-select-dropdown"
        v-model="action.glMapSceneRoam.sceneId"
        placeholder="请选择场景"
        @change="handleSceneChange"
      >
        <el-option
          v-for="item in sceneOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
          :disabled="item.disabled"
        />
      </el-select>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";

import { extractComponentId } from "@/utils/utils";

import { useCustomEvent } from "../../useCustomEvent";

interface SceneOption {
  label: string;
  value: string;
  disabled?: boolean;
}

const { currentAction: action, update, allComponentMap } = useCustomEvent();

const ensureActionConfig = () => {
  if (!action.value.glMapSceneRoam) {
    action.value.glMapSceneRoam = {
      sceneId: ""
    };
  }
};

const targetMapComponent = computed(() => {
  const component = action.value?.component?.[0];
  if (!component) {
    return null;
  }
  return allComponentMap.value.get(`${extractComponentId(component)}`) || null;
});

const normalizeSceneList = (viewManager: any): any[] => {
  if (Array.isArray(viewManager?.sceneList) && viewManager.sceneList.length) {
    return viewManager.sceneList;
  }

  if (Array.isArray(viewManager?.viewList) && viewManager.viewList.length) {
    return viewManager.viewList.map((item: any, index: number) => ({
      id: item?.id || `legacy_view_${index}`,
      name: item?.name || `场景${index + 1}`,
      shots: [
        {
          id: `legacy_shot_${index}`,
          name: "视角1",
          duration: item?.duration ?? 5,
          camera: item?.camera
        }
      ]
    }));
  }

  return [];
};

const sceneOptions = computed<SceneOption[]>(() => {
  const target = targetMapComponent.value;
  const sceneList = normalizeSceneList(target?.option?.viewManager);

  return sceneList.map((scene: any, index: number) => ({
    label: scene?.name || `场景${index + 1}`,
    value: scene?.id || `scene_${index}`,
    disabled: !Array.isArray(scene?.shots) || scene.shots.length === 0
  }));
});

const handleSceneChange = () => {
  ensureActionConfig();
  update();
};

watch(
  sceneOptions,
  (options) => {
    ensureActionConfig();

    const currentSceneId = String(action.value.glMapSceneRoam.sceneId || "");
    if (currentSceneId && !options.some((item) => item.value === currentSceneId)) {
      action.value.glMapSceneRoam.sceneId = "";
      update();
    }
  },
  { immediate: true }
);
</script>
