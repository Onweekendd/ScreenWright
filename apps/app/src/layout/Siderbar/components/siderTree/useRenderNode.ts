import { computed, nextTick, onMounted, ref } from "vue";

import { ElMessage, ElMessageBox } from "element-plus";

import { useDialog } from "@/hooks/useDialog";
import { useUserStoreHook } from "@/store/modules/user";
import to from "@/utils/await-to-js";

import createDir from "./createDir.vue";
import { useSiderTreeData } from "./useSiderTreeData";

export interface RenderNodeProps {
  data: any;
  addApi: (param: any) => Promise<any>;
  delApi: (param: any) => Promise<any>;
  updateApi: (param: any) => Promise<any>;
}

export const useRenderNode = (props: RenderNodeProps) => {
  const { dialog } = useDialog();
  const userStore = useUserStoreHook();
  const {
    refreshKey,
    treeDataMap,
    treeData,
    currentNode,
    getTreeData,
    setTreeChecked,
    deleteNodeById,
    setFirstNode,
    setCurrentNode,
    setDefaultExpandedKeys
  } = useSiderTreeData();

  const localLabel = ref(props.data.label);
  const currentEditId = ref("");
  const editInput = ref<HTMLInputElement | null>(null);
  const defaultLabel = ref();

  const isDefaultValue = computed(() => {
    return props.data && props.data.label === defaultLabel.value;
  });
  const isShowEditInput = computed(() => {
    return props.data && props.data.id === currentEditId.value;
  });
  const handleEdit = async () => {
    currentEditId.value = props.data.id;
    await nextTick();
    if (editInput.value) {
      editInput.value.focus();
    }
  };
  const deleteNodeCount = () => {
    if (treeData.value && currentNode.value && currentNode.value.count) {
      const parentNode = treeData.value[0];
      const delCount = currentNode.value.count || 0;
      if (parentNode && parentNode.count) {
        parentNode.count -= delCount;
      }
    }
  };

  const handleDelete = () => {
    ElMessageBox.confirm(
      `确定删除分组: ${localLabel.value}，该分组下的文件/数据等将被删除，该操作不可逆，确认删除吗？`,
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        customClass: "sw-message-box"
      }
    )
      .then(async () => {
        const [error, res] = await to(props.delApi(props.data.id));
        if (error) {
          ElMessage.error(error.message || "删除失败");
          return;
        }
        if (res && res.code === 200) {
          ElMessage.success(res.message || "删除成功");
          deleteNodeCount(); // 删除节点数量
          deleteNodeById(props.data.uuid);
          // 如果第一个节点等于当前节点id则不执行
          setFirstNode();
        } else {
          ElMessage.error(res.message || "删除失败");
        }
      })
      .catch(() => {
        console.log("cancel");
      });
  };

  const handleBlur = async () => {
    currentEditId.value = "";
    if (isDefaultValue.value) {
      return;
    }
    const [error, res] = await to(
      props.updateApi({
        id: props.data.id,
        name: localLabel.value
      })
    );
    if (error) {
      return;
    }
    if (res && res.code === 200) {
      ElMessage.success(res.message || "修改成功");
    } else {
      ElMessage.error(res.message || "修改失败");
    }
  };

  const addGroup = () => {
    dialog({
      DialogProps: {
        title: "新建分组",
        width: "500px"
      },
      componentProps: {},
      component: createDir,
      center: true,
      closeBefore: async (componentData, done) => {
        const dataRes = await componentData.validate();
        if (dataRes.success) {
          const params = {
            name: dataRes.name,
            orgId: userStore.userInfo ? userStore.userInfo.id : 0,
            parentId: props.data.id,
            type: props.data.id
          };
          const [error, res] = await to(props.addApi(params));

          if (error) {
            ElMessage.error("服务器错误");
            done();
            return;
          }
          if (res && res.code === 200) {
            ElMessage.success(res.message || "新增成功");
            done();
            await getTreeData(false);
            refreshKey.value++;
            setDefaultExpandedKeys(props.data.uuid);
            const uuid = treeDataMap.value[res.result.id];
            await setTreeChecked(uuid);
            setCurrentNode();
          } else {
            ElMessage.error(res.message || "新增失败");
            done();
          }
        }
      }
    });
  };

  const hasShowInput = computed(() => {
    return props.data && "showInput" in props.data;
  });
  onMounted(() => {
    defaultLabel.value = props.data.label;
  });
  return {
    localLabel,
    editInput,
    isShowEditInput,
    hasShowInput,
    handleEdit,
    handleDelete,
    handleBlur,
    addGroup
  };
};
