import type { Ref } from "vue";
import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { ElMessage } from "element-plus";
import { isArray } from "lodash-es";

import {
  copyMinioScene,
  deleteBatchMinioScene,
  deleteMinioScene,
  minioGroupList,
  updateFileScene,
  uploadMinioScene
} from "@/api/assets";
import { useDialog } from "@/hooks/useDialog";
import type { MenuItem } from "@/layout/Siderbar/components/config/menuConfig";
import { useSiderTreeData } from "@/layout/Siderbar/components/siderTree/useSiderTreeData";
import type { assetItem } from "@/model/Assets";
import to from "@/utils/await-to-js";
import { setMinioUrl } from "@/utils/config";
import { handleMessageBox } from "@/utils/utils";

import { type FileTypeEnum } from "../build/components/buildTabs/assetsEditFrom/type";
import assetAddForm from "./components/assetAddForm.vue";
import assetDetail from "./components/assetDetail.vue";
import assetPreview from "./components/assetPreview.vue";
import { getFileType } from "./emum";

interface Props {
  getAssetsListData?: () => void;
}

export const useAssetAction = createGlobalState((props: Props = {}) => {
  const { dialog } = useDialog();
  const { currentNode, treeData } = useSiderTreeData();
  const loading = ref(false);
  const checkedItem = ref<Array<assetItem>>([]);
  const isChecked = ref(false);

  const getGroupOptions = (currentNode: MenuItem | null) => {
    if (!currentNode) {
      return [];
    }
    const parent = currentNode.pid ? treeData.value.find((item) => item.id === currentNode.pid) : currentNode;
    if (!parent) {
      return [];
    }
    const children = parent.children.filter((v) => !v.outsider) || [];
    return children.map((item: MenuItem) => {
      return {
        ...item,
        value: `${item.id}`
      };
    });
  };

  const setAssetsTreeData = async () => {
    const res = await minioGroupList();
    if (res.code === 200 && res.success) {
      const result = res.result || {};
      const groupConfig = [
        ["pageGroups", result.pageGroups || {}],
        ["modelGroups", result.modelGroups || {}]
        // 后续新增：["fileGroups", result.fileGroups || {}]
      ];
      const updateGroupTreeCount = (groupName: string, groupData: any) => {
        const treeNode = treeData.value.find((v) => v.name === groupName);
        if (!treeNode) return;
        const unGroupNode = treeNode.children.find((v) => `${v.id}` === "0");
        if (unGroupNode) unGroupNode.count = groupData.unCount || 0;
        const normalChildren = treeNode.children.filter((v) => `${v.id}` !== "0");
        const groupList = groupData.list || [];
        normalChildren.forEach((child, index) => {
          child.count = groupList[index]?.count || 0;
        });
      };

      // 批量处理所有分组，新增分组无需改这里
      groupConfig.forEach(([name, data]) => updateGroupTreeCount(name, data));

      console.log(result.pageGroups, "pageGroups");
      console.log(treeData.value, "treeData");
    }
  };

  const handleEditAndAdd = (item: assetItem) => {
    const options = getGroupOptions(currentNode.value);
    const fileType = getFileType(currentNode, treeData);
    if (!fileType) {
      ElMessage.error("素材类型未知");
      return;
    }

    dialog({
      DialogProps: {
        title: item.id ? "编辑素材" : "上传素材",
        width: "35%"
      },
      componentProps: {
        groupOptions: options,
        item,
        fileType,
        groupId: item.id ? `${item.groupId ?? ""}` : `${currentNode.value?.id ?? ""}`
      },
      component: assetAddForm,
      closeBefore: async (componentData, done) => {
        const dataRes = await componentData.validate();
        if (!dataRes.success) {
          return;
        }
        console.log(dataRes.data, item.id, "closeBefore");
        let success = false;
        if (isArray(dataRes.data.file)) {
          if (dataRes.data.file.length === 1) {
            const transformParams = {
              ...dataRes.data,
              file: dataRes.data.file[0],
              coverFile: dataRes.data.coverFile && dataRes.data.coverFile.raw ? dataRes.data.coverFile.raw : "",
              fileType
            };

            // if (transformParams.resourceType == ResourceTypeEnum.image) {
            //   transformParams.file = await batchCompressPic(transformParams.file as File, 4);
            // }

            const res = item.id
              ? await updateFileScene({
                  ...transformParams,
                  id: item.id
                })
              : await uploadMinioScene(transformParams);
            if (res.success && res.code === 200) {
              await setAssetsTreeData();
              ElMessage.success(res.message || "上传成功");
              success = true;

              // props.getAssetsListData && props.getAssetsListData()
            } else {
              ElMessage.error(res.message || "上传失败");
            }
          } else {
            for (let i = 0; i < dataRes.data.file.length; i++) {
              const transformParams = {
                ...dataRes.data,
                file: dataRes.data.file[i],
                name: dataRes.data.file[i].name,
                coverFile: "",
                fileType
              };
              // console.log("transformParams", transformParams);
              // if (transformParams.resourceType == ResourceTypeEnum.image) {
              //   transformParams.file = await batchCompressPic(transformParams.file as File, 4);
              // }

              const res = await uploadMinioScene(transformParams);

              if (res.success && res.code === 200) {
                await setAssetsTreeData();
                ElMessage.success(res.message || "上传成功");
                success = true;
              } else {
                ElMessage.error(res.message || "上传失败");
              }
            }
          }
        }
        if (props.getAssetsListData && success) {
          props.getAssetsListData();
        }
        done();
      }
    });
  };

  // 添加素材
  const handleAdd = () => {
    handleEditAndAdd({} as assetItem);
  };
  // 素材使用情况
  const handleUseDetail = (item: assetItem) => {
    dialog({
      DialogProps: {
        title: "使用情况",
        width: "650px"
      },
      componentProps: {
        item
      },
      component: assetDetail
    });
  };
  // 素材复制
  const handleCopy = async (item: assetItem) => {
    loading.value = true;
    const res = await copyMinioScene(item.id);
    if (res.success) {
      await setAssetsTreeData();
      ElMessage.success(res.message || "复制成功");

      if (props.getAssetsListData) {
        props.getAssetsListData();
      }
      // props.getAssetsListData && props.getAssetsListData()
    } else {
      ElMessage.error(res.message || "复制失败");
    }
    loading.value = false;
  };

  // 删除素材
  const handleDelete = async (item: assetItem) => {
    const isDelete = await handleMessageBox("是否确认删除?", {
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    });
    if (!isDelete) {
      return;
    }
    loading.value = true;
    const res = await deleteMinioScene(item.id);
    if (res.success) {
      await setAssetsTreeData();
      ElMessage.success(res.message || "删除成功");

      if (props.getAssetsListData) {
        props.getAssetsListData();
      }
    } else {
      ElMessage.error(res.message || "删除失败");
    }
    loading.value = false;
  };
  // 批量删除
  const handleBatchDelete = async () => {
    if (checkedItem.value.length === 0) {
      ElMessage.error("请选择需要删除的素材");
      return;
    }
    const isDelete = await handleMessageBox("确认批量删除?", {
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    });
    if (!isDelete) {
      return;
    }
    const params = {
      fileType: getFileType(currentNode, treeData),
      ids: checkedItem.value.map((item) => item.id).join(",")
    };

    if (!params.fileType) {
      ElMessage.error("删除失败");
      return;
    }

    const [error, res] = await to(deleteBatchMinioScene(params as { fileType: FileTypeEnum; ids: string }));
    if (error) {
      ElMessage.error("删除失败");
      return;
    }
    if (res && res.success) {
      ElMessage.success(res.message || "删除成功");
      if (currentNode.value && currentNode.value.count !== undefined) {
        const length = checkedItem.value.length;
        currentNode.value.count = length > currentNode.value.count ? 0 : currentNode.value.count - length;
      }
      checkedItem.value = [];
      isChecked.value = false;

      if (props.getAssetsListData) {
        props.getAssetsListData();
      }
    } else {
      ElMessage.error(res.message || "删除失败");
    }
  };
  // 全选所有的数据
  const handleSelectAllDelete = (tableData: Ref<assetItem[]>, val: boolean) => {
    if (val) {
      checkedItem.value = [];
      tableData.value.forEach((item) => {
        checkedItem.value.push(item);
      });
    } else {
      checkedItem.value = [];
    }
  };
  // 预览数据
  const handlePreview = (item: assetItem) => {
    dialog({
      DialogProps: {
        title: "资产预览",
        width: "960px"
      },
      componentProps: {
        item
      },
      component: assetPreview
    });
  };

  // 编辑数据
  const handleEdit = (item: assetItem) => {
    handleEditAndAdd(item);
  };

  // 导出数据
  const handleExport = async (item: assetItem) => {
    const filename = `${item.name}.${item.url.split(".")[item.url.split(".").length - 1]}`;
    const url = setMinioUrl(item.url);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("下载失败");
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.click();

      // 释放 blob URL
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(error);
      ElMessage.error("下载失败");
    }
  };

  return {
    loading,
    checkedItem,
    isChecked,
    handlePreview,
    handleExport,
    handleEdit,
    handleAdd,
    handleCopy,
    handleDelete,
    handleBatchDelete,
    handleUseDetail,
    handleSelectAllDelete
  };
});
