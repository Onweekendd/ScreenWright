import { useRoute, useRouter } from "vue-router";

import { ElMessage } from "element-plus";

import { getLargeScreenGroupList } from "@/api/dataSource";
import { exportPackage, getScreenVersionList } from "@/api/version";
import { dbManager, STORE_NAME } from "@/db";
import { useDialog } from "@/hooks/useDialog";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import type { ScreenItem } from "@/model/Visual";
import to from "@/utils/await-to-js";
import { handleMessageBox } from "@/utils/utils";
import { setVersionCode } from "@/utils/version";

import exportComponent from "./components/exportComponent/index.vue";
import { ExportTypeEnum } from "./components/exportComponent/useExportComponent";
import selectVersion from "./components/selectVersion/index.vue";
import { outputExportFile } from "./exportfile";
import templateAddForm from "./templateAddForm.vue";
import { useModelApi } from "./useModelApi";
import { useTemplateData } from "./useTemplateData";

export const useTemplateMenu = (screenItem: ScreenItem) => {
  const route = useRoute();
  const router = useRouter();
  const { loading } = useGlobalLoading();
  const { modelApi } = useModelApi();
  const { dialog } = useDialog();
  const { currentNode, treeData, listRefreshKey, refreshList, getSelectOptionsByNode } = useTemplateData();

  const checkItemBackgroundUrl = () => {
    let result = true;
    if (route.path === "/map") {
      if (!screenItem.backgroundUrl) {
        result = false;
      }
    }
    return result;
  };

  const refreshTreeCount = async () => {
    const groupNumberRes = await getLargeScreenGroupList();
    if (groupNumberRes.code === 200 && groupNumberRes.success) {
      const { allCount, list, unCount } = groupNumberRes.result;
      treeData.value[0].count = allCount;
      treeData.value[1].children = treeData.value[1].children.map((item: any, index: number) => {
        item.count = list[index].count;
        return item;
      });
      treeData.value[2].count = unCount;
    }
  };

  const handleCopyApi = async (versionCode: string, done?: () => void) => {
    const [error, res] = await to(
      modelApi.value.copyScreenObj({
        id: screenItem.id,
        versionCode
      })
    );
    if (error) {
      ElMessage.error("复制失败");
      if (done) {
        done();
      }
      return;
    }
    if (res && res.success) {
      ElMessage.success("复制成功");
      await refreshList(true);
    } else {
      ElMessage.error(res.message || "复制失败");
    }
    if (done) {
      done();
    }
  };
  // 处理复制按钮
  const handleCopy = async () => {
    const result = checkItemBackgroundUrl();
    if (!result) {
      ElMessage.warning("空白场景不可复制！");
      return;
    }
    const [error, resList] = await to(getScreenVersionList(screenItem.id));
    if (error) {
      ElMessage.error("获取版本信息失败");
      return;
    }
    if (resList) {
      const versionList = resList.result;
      if (versionList.length > 1) {
        const title = "选择复制版本";
        dialog({
          DialogProps: {
            title,
            width: "30%"
          },
          componentProps: {
            listData: versionList
          },
          closeBefore: async (componentData, done) => {
            const dataRes = await componentData.validate();
            const versionCode = dataRes.versionCode;
            await handleCopyApi(versionCode, done);
          },
          component: selectVersion
        });
      } else {
        const confirmRes = await handleMessageBox("确认复制当前应用");
        if (confirmRes) {
          const versionList = resList.result;
          const versionCode = versionList[0]?.versionCode || "1";

          await handleCopyApi(versionCode);
        }
      }
    }
  };
  // 修改应用信息
  const updateTemplate = () => {
    const options = getSelectOptionsByNode(currentNode.value);
    dialog({
      DialogProps: {
        title: "编辑应用",
        width: "35%"
      },
      componentProps: {
        options: options as any,
        defaultFormData: {
          name: screenItem.name,
          groupId: screenItem.groupId
        }
      },
      closeBefore: async (componentData, done) => {
        componentData.setLoading(true);
        const dataRes = await componentData.validate();
        if (!dataRes.success) {
          componentData.setLoading(false);
          return;
        }
        const params = {
          groupId: dataRes.groupId,
          id: screenItem.id,
          name: dataRes.name,
          type: screenItem.type
        };
        const [error, res] = await to(modelApi.value.updateScreenData(params));
        if (error) {
          ElMessage.error("修改失败");
          done();
          return;
        }
        if (res && res.success) {
          dbManager.delete(STORE_NAME, screenItem.id);
          ElMessage.success("修改成功");
          refreshTreeCount();
          done();
          await refreshList(true);
          listRefreshKey.value++;
        } else {
          ElMessage.error(res.message || "修改失败");
          done();
        }
        componentData.setLoading(false);
      },
      component: templateAddForm
    });
  };
  const deleteTemplate = async () => {
    const confirmRes = await handleMessageBox(`是否确认永久删除该应用? 【${screenItem.name}】`);
    if (confirmRes) {
      const [error, res] = await to(modelApi.value.deleteScreenObj(screenItem.id));
      if (error) {
        ElMessage.error("删除失败");
        return;
      }
      if (res && res.success) {
        ElMessage.success(res.message || "删除成功");
        refreshTreeCount();
        await refreshList(true);
      } else {
        ElMessage.error(res.message || "删除失败");
      }
    }
  };

  /**
   * 处理应用文件导出
   * @param dataRes 验证后的导出数据
   * @param done 完成回调
   */
  const handlePackageFileExport = async (dataRes: any, done: () => void) => {
    const [error, res] = await to(
      exportPackage({
        id: screenItem.id,
        exportType: dataRes.exportType,
        versionCode: dataRes.versionCode
      })
    );
    if (error || !res) {
      ElMessage.error("导出失败");
    }
    done();
  };

  /**
   * 处理离线应用导出
   * @param dataRes 验证后的导出数据
   * @param done 完成回调
   */
  const handleOfflinePackageExport = async (dataRes: any, done: () => void) => {
    done();

    // 导出走 Version-Code 请求头取对应版本的配置
    if (dataRes.versionCode) {
      setVersionCode(dataRes.versionCode);
    }

    const [error] = await to(outputExportFile({ id: screenItem.id, name: screenItem.name }));
    if (error) {
      ElMessage.error(error.message || "导出失败");
    }
  };

  /**
   * 处理导出数据验证和分发
   * @param componentData 组件数据
   * @param done 完成回调
   */
  const processExportData = async (componentData: any, done: () => void) => {
    const dataRes = await componentData.validate();

    if (!dataRes.success) {
      return;
    }

    // 根据导出类型选择处理策略
    if (dataRes.exportType === ExportTypeEnum.PACKAGE_FILE) {
      await handlePackageFileExport(dataRes, done);
    } else {
      await handleOfflinePackageExport(dataRes, done);
    }
  };

  // 导出应用
  const handleExport = () => {
    dialog({
      DialogProps: {
        title: "导出信息",
        width: "30%"
      },
      componentProps: {
        item: screenItem
      },
      component: exportComponent,
      closeBefore: processExportData
    });
  };

  // 编辑应用
  const handleEdit = async () => {
    loading.value = true;
    const res = await getScreenVersionList(screenItem.id);
    console.log(res, "getScreenVersionList");
    if (res.code === 200) {
      if (res.result.length > 1) {
        const title = "请选择编辑的版本";
        dialog({
          DialogProps: {
            title,
            width: "30%"
          },
          componentProps: {
            listData: res.result
          },
          closeBefore: async (componentData, done) => {
            const dataRes = await componentData.validate();
            const versionCode = dataRes.versionCode;
            setVersionCode(versionCode);

            await router.push({
              path: `/build/${screenItem.id}`
            });
            localStorage.removeItem("versionCodeList");
            done();
          },
          component: selectVersion
        });
      } else {
        setVersionCode(res.result[0].versionCode);
        localStorage.removeItem("versionCodeList");
        await router.push({
          path: `/build/${screenItem.id}`
        });
      }
    }
    loading.value = false;
  };
  // 预览应用
  const handlePreview = async () => {
    const res = await getScreenVersionList(screenItem.id);
    if (res.code === 200) {
      if (res.result.length > 1) {
        const title = "请选择预览的版本";
        dialog({
          DialogProps: {
            title,
            width: "30%"
          },
          componentProps: {
            listData: res.result
          },
          closeBefore: async (componentData, done) => {
            const dataRes = await componentData.validate();
            const versionCode = dataRes.versionCode;
            const { href } = router.resolve({
              path: `/view/${screenItem.id}`,
              query: {
                version: versionCode,
                status: "0",
                type: "0"
              }
            });
            window.open(href, "_blank");
            done();
          },
          component: selectVersion
        });
      } else {
        const versionCode = res.result[0].versionCode;
        const { href } = router.resolve({
          path: `/view/${screenItem.id}`,
          query: {
            version: versionCode,
            status: "0",
            type: "0"
          }
        });
        window.open(href, "_blank");
      }
    }
  };

  return {
    handleEdit,
    handlePreview,
    updateTemplate,
    handleCopy,
    deleteTemplate,
    handleExport
  };
};
