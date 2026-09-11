import type { Ref } from "vue";
import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { apiClient } from "@screenwright/server/rpc";
import { ElMessage } from "element-plus";

import { getDataGroupList, testDbConnect } from "@/api/dataSource";
import { useDialog } from "@/hooks/useDialog";
import type { MenuItem } from "@/layout/Siderbar/components/config/menuConfig";
import { useSiderTreeData } from "@/layout/Siderbar/components/siderTree/useSiderTreeData";
import type { BaseEntity } from "@/model/BaseEntity";
import type { DbItem } from "@/model/DataModel";
import to from "@/utils/await-to-js";
import { downFile, setMinioUrl } from "@/utils/config";
import { handleMessageBox } from "@/utils/utils";

import apiPreview from "./components/apiPreview.vue";
import dataForm from "./components/dataForm.vue";
import previewForm from "./components/previewForm.vue";
import { getTypeOptions } from "./fild";
import { apiSourceModel } from "./model/index";
import { DataSourceType } from "./type";

interface Props {
  refresh?: () => void;
  menuActive: Ref<DataSourceType>;
}

export const useActionMenu = createGlobalState((props: Props) => {
  const { dialog } = useDialog();
  const { treeData, currentNode } = useSiderTreeData();
  const loading = ref(false);

  const getGroupDataOptions = (treeData: MenuItem[]) => {
    if (!treeData || treeData.length === 0) {
      return [];
    }
    const groupDataOptions = treeData[1].children.map((item: MenuItem) => {
      return {
        label: item.label,
        value: item.id,
        uuid: item.uuid
      };
    });
    return groupDataOptions;
  };

  // 测试数据库连接是否通过
  const dbIsConnect = async (info: { url: string; username: string; password: string; type: string }) => {
    let result = false;
    if (props.menuActive.value === DataSourceType.DB) {
      const res = await testDbConnect({
        url: info.url,
        username: info.username,
        password: info.password,
        dbType: info.type,
        port: 8088
      });
      if (res.success) {
        ElMessage.success(res.message);
        result = true;
      } else {
        ElMessage.error(res.message);
        loading.value = false;
        result = false;
      }
    } else {
      result = true;
    }
    return result;
  };

  const handleDataForm = (row?: DbItem) => {
    const groupDataOptions = getGroupDataOptions(treeData.value);
    const typeOptions = getTypeOptions(props.menuActive.value);
    dialog({
      DialogProps: {
        title: "创建数据源",
        width: "550px"
      },
      center: true,
      componentProps: {
        groupDataOptions: groupDataOptions as any,
        menuActive: props.menuActive,
        typeOptions: typeOptions as any,
        group: Number(currentNode.value?.id) < 0 ? "" : currentNode.value?.id,
        dbIsConnect,
        row: row || {}
      } as any,
      component: dataForm,
      closeBefore: async (componentData, done) => {
        const info = await componentData.validate();
        if (!info.success) {
          return;
        }
        loading.value = true;
        let isConnect = true;
        const apiSource = new apiSourceModel(info, props.menuActive.value);
        isConnect = await dbIsConnect(info);
        if (!isConnect) {
          loading.value = false;
          return;
        }
        if (!info.group) {
          info.group = "";
        }
        const shouldRegisterSwagger = props.menuActive.value === DataSourceType.API && info.swaggerUrl && info.baseUrl;

        if (!info.id) {
          const [error, res] = await to<BaseEntity<null>>(apiSource.addApi(info));
          if (error) {
            loading.value = false;
            ElMessage.error("新增数据失败");
            return;
          }
          if (res && res.success) {
            updateTreeData();
            ElMessage.success(res.message || "新增数据成功");
            if (shouldRegisterSwagger && res.result) {
              const datasourceId = (res.result as any).id ?? (res.result as any);
              if (datasourceId) {
                apiClient.customApi.datasource["register-swagger"]
                  .$post({
                    json: { datasourceId, swaggerUrl: info.swaggerUrl!, baseUrl: info.baseUrl }
                  })
                  .catch(() => {});
              }
            }
          } else {
            ElMessage.error(res.message || "新增数据失败");
          }
        } else {
          const [error, res] = await to<BaseEntity<null>>(apiSource.editApi(info));
          if (error) {
            loading.value = false;
            ElMessage.error("编辑数据失败");
            return;
          }
          if (res && res.success) {
            ElMessage.success(res.message || "编辑数据成功");
            if (shouldRegisterSwagger) {
              apiClient.customApi.datasource["register-swagger"]
                .$post({
                  json: { datasourceId: info.id!, swaggerUrl: info.swaggerUrl!, baseUrl: info.baseUrl }
                })
                .catch(() => {});
            }
          } else {
            ElMessage.error(res.message || "编辑数据失败");
          }
        }

        loading.value = false;
        done();
        if (props.refresh) {
          props.refresh();
        }
      }
    });
  };

  const addDataSource = () => {
    handleDataForm();
  };

  const updateTreeData = async () => {
    const res = await getDataGroupList();
    if (res.success) {
      const result = res.result;
      const { allCount, groupedCount, list, unGroupedCount } = result;
      treeData.value[0].count = allCount;
      treeData.value[1].count = groupedCount;
      treeData.value[1].children = treeData.value[1].children.map((item: any, index: number) => {
        item.count = list[index].count;
        return item;
      });
      treeData.value[2].count = unGroupedCount;
    }
  };

  // 预览数据源
  const previewDataSource = async (row: DbItem) => {
    const component = props.menuActive.value === DataSourceType.API ? apiPreview : previewForm;
    const width = props.menuActive.value === DataSourceType.API ? "1300px" : "860px";
    dialog({
      DialogProps: {
        title: `数据管理-预览${row.name}`,
        width
      },
      componentProps: {
        row
      },
      component,
      center: true
    });
  };
  // 编辑数据源
  const editDataSource = (row: DbItem) => {
    handleDataForm(row);
  };

  // 删除数据源
  const deleteDataSource = async (row: DbItem) => {
    const isCanDel = await handleMessageBox("该数据如被删除，可能会导致使用本数据的组件异常，确认删除？", {
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    });
    if (isCanDel) {
      const apiSource = new apiSourceModel(row, props.menuActive.value);
      const [error, res] = await to<BaseEntity<null>>(apiSource.delApi(row.id));
      if (error) {
        ElMessage.error("删除数据源失败");
        return;
      }
      if (res && res.success) {
        const resFf = await getDataGroupList();
        console.log(resFf, "resFf");
        updateTreeData();
        // if (currentNode.value && row.dataGroupId) {
        //   const uuid = treeDataMap.value[row.dataGroupId].uuid;
        //   const groupNode = getNodeById(uuid);
        //   if (groupNode && treeData.value[0] && treeData.value[0].count !== undefined) {
        //     treeData.value[0].count--;
        //     groupNode.data.count--;
        //   }
        // }

        ElMessage.success(res.message || "删除数据源成功");
        if (props.refresh) {
          props.refresh();
        }
      } else {
        ElMessage.error(res.message || "删除数据源失败");
      }
    }
  };

  // 下载数据源
  const downloadUrl = (row: DbItem) => {
    const url = setMinioUrl(row.url);
    downFile(url);
  };

  return {
    loading,
    addDataSource,
    previewDataSource,
    editDataSource,
    deleteDataSource,
    downloadUrl
  };
});
