import { toRef } from "vue";

import { ElMessage } from "element-plus";

import { getDataGroupList, testDbConnect } from "@/api/dataSource";
import { useDialog } from "@/hooks/useDialog";
import type { BaseEntity } from "@/model/BaseEntity";
import to from "@/utils/await-to-js";
import dataForm from "@/views/source/components/dataForm.vue";
import { getTypeOptions } from "@/views/source/fild";
import { apiSourceModel } from "@/views/source/model";
import { DataSourceType } from "@/views/source/type";

import { useDataApi } from "./useDataApi";

export const useNewAddDialog = (type: DataSourceType) => {
  const { dialog } = useDialog();
  const { setOptions } = useDataApi(DataSourceType.LOCAL);
  const typeOptions = getTypeOptions(type);

  // 测试数据库连接是否通过
  const dbIsConnect = async (info: { url: string; username: string; password: string; type: string }) => {
    let result = false;
    if (type === DataSourceType.DB) {
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
        result = false;
      }
    } else {
      result = true;
    }
    return result;
  };

  const newAdd = async () => {
    const res = await getDataGroupList();
    let groupDataOptions: Array<{ value: number; label: string }> = [];
    if (res.success) {
      groupDataOptions = res.result.list.map((v) => {
        return {
          label: v.name,
          value: v.id
        };
      });
    }
    dialog({
      DialogProps: {
        title: "创建数据源",
        width: "550px",
        modalClass: "data-interface-dialog"
      },
      center: true,
      componentProps: {
        menuActive: toRef(type),
        typeOptions,
        groupDataOptions: groupDataOptions as any,
        group: "",
        dbIsConnect,
        row: {} as any
      },
      component: dataForm,
      closeBefore: async (componentData, done) => {
        const info = await componentData.validate();
        if (!info.success) {
          return;
        }
        let isConnect = true;
        const apiSource = new apiSourceModel(info, type);
        isConnect = await dbIsConnect(info);
        if (!isConnect) {
          return;
        }
        if (!info.group) {
          info.group = "";
        }
        const [error, res] = await to<BaseEntity<null>>(apiSource.addApi(info));
        if (error) {
          ElMessage.error("新增数据失败");
          return;
        }
        if (res && res.success) {
          setOptions(type);
          ElMessage.success(res.message || "新增数据成功");
        } else {
          ElMessage.error(res.message || "新增数据失败");
        }
        done();
      }
    });
  };
  return {
    newAdd
  };
};
