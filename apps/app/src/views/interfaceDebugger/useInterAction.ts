import { ElMessage } from "element-plus";
import { flatten } from "lodash-es";

import {
  copyInterfaceDebugger,
  delInterfaceDebugger,
  saveInterfaceDebugger,
  updateInterfaceDebugger
} from "@/api/interfaceDebugger";
import { useDialog } from "@/hooks/useDialog";
import type { MenuItem } from "@/layout/Siderbar/components/config/menuConfig";
import { useSiderTreeData } from "@/layout/Siderbar/components/siderTree/useSiderTreeData";
import type { InterfaceItem } from "@/model/InterfaceDebugger";
import to from "@/utils/await-to-js";
import { handleMessageBox } from "@/utils/utils";

import interFaceForm from "./components/interFaceForm.vue";

interface Props {
  refreshList?: () => void;
}

export const useInterAction = (props: Props) => {
  const { dialog } = useDialog();
  const { treeData, currentNode } = useSiderTreeData();

  const getSelectOptionsByNode = (node: MenuItem | null) => {
    if (!node) {
      return [];
    }
    if (node.outsider) {
      // 遍历treeData.value 找到 children.length>0的children
      const children = treeData.value
        .filter((item) => item.children && item.children.length > 0)
        .map((item) => item.children);
      const options = flatten(children);
      options.unshift(node);
      return options;
    }
    return [node];
  };

  const setCount = (plus: boolean) => {
    if (!currentNode.value) {
      return;
    }
    if (currentNode.value.count === undefined) {
      currentNode.value.count = 0;
    }
    if (currentNode.value && currentNode.value.count !== undefined) {
      const pid = -2;
      const parentNode = treeData.value.find((item) => item.id === pid);
      if (plus) {
        currentNode.value.count++;
      } else {
        currentNode.value.count--;
      }

      if (currentNode.value.id !== pid && parentNode && parentNode.count && currentNode.value.count !== undefined) {
        if (plus) {
          parentNode.count++;
        } else {
          parentNode.count--;
        }
      }
    }
  };

  const handleDelete = async (item: InterfaceItem) => {
    const confirmRes = await handleMessageBox(`是否确认永久删除该场景? 【${item.name}】`);
    if (confirmRes) {
      const [error, res] = await to(delInterfaceDebugger(item.id));
      if (error) {
        ElMessage.error("删除失败");
        return;
      }
      if (res && res.success) {
        ElMessage.success(res.message || "删除成功");
        setCount(false);
        props.refreshList && props.refreshList();
      } else {
        ElMessage.error(res.message || "删除失败");
      }
    }
  };

  const handleInterfaceForm = (item: InterfaceItem) => {
    const options: MenuItem[] = getSelectOptionsByNode(currentNode.value);
    const isAdd = Object.keys(item).length === 0;
    dialog({
      DialogProps: {
        title: isAdd ? "新增调试器" : "编辑调试器",
        width: "35%"
      },
      closeBefore: async (componentData, done) => {
        const dataRes = await componentData.validate();
        if (!dataRes.success) {
          return;
        }
        const api = isAdd ? saveInterfaceDebugger : updateInterfaceDebugger;
        const [error, res] = await to(api(dataRes));
        if (error) {
          return;
        }
        if (res && res.success) {
          const msg = isAdd ? "新增成功" : "编辑成功";
          ElMessage.success(msg);
          isAdd && setCount(true);
          props.refreshList && props.refreshList();
          done();
        } else {
          const msg = isAdd ? "新增失败" : "编辑失败";
          ElMessage.error(msg);
          done();
        }
      },
      componentProps: {
        options,
        defaultFormData: item
      },
      component: interFaceForm
    });
  };

  const handleAddClick = () => {
    handleInterfaceForm({} as InterfaceItem);
  };

  const handleEdit = (item: InterfaceItem) => {
    handleInterfaceForm(item);
  };

  const handleCopy = async (item: InterfaceItem) => {
    const confirmRes = await handleMessageBox(`确认复制当前场景 【${item.name}】`);
    if (!confirmRes) {
      return;
    }
    const [error, res] = await to(copyInterfaceDebugger(item.id));
    if (error) {
      ElMessage.error("复制失败");
      return;
    }
    if (res && res.success) {
      ElMessage.success("复制成功");
      setCount(true);
      props.refreshList && props.refreshList();
    } else {
      ElMessage.error(res.message || "复制失败");
    }
  };

  return {
    handleAddClick,
    handleDelete,
    handleEdit,
    handleCopy
  };
};
