import { computed, onMounted, ref } from "vue";

import { ElMessage, type FormInstance, type FormRules } from "element-plus";

import { BaseName } from "@/utils/config";
import { batchCompressPic } from "@/utils/utils";
import { assetsClassManager } from "@/views/build/components/buildTabs/selectAssets/assetsClass";
import { useLargeScreenInfo } from "@/views/build/useLargeScreenInfo";
import { useTabsMenuGroup } from "@/views/build/useTabsMenuGroup";

import type { UploadResult } from "../selectAssets/assetsBaseClass";
import type { Form, propOptionType, Props } from "./type";
import { EditTypeEnum, FileTypeEnum, ResourceTypeEnum } from "./type";

// 预览图片接口
interface PreviewImage {
  file: File | null; // 编辑模式下为 null，新增模式下为 File
  previewUrl: string;
  title: string;
}

export const useAssetsEdit = (props: Props) => {
  const editType = ref(EditTypeEnum.add); // 1新增 2编辑
  const { assetsData } = useTabsMenuGroup();
  const { navInfo } = useLargeScreenInfo();
  // 弹窗显示控制

  const groupOptions = computed(() => {
    console.log(props, "assetsDataassetsData");
    const allOptions =
      props.title === "资产库"
        ? [
            {
              label: "全部",
              value: 0
            }
          ]
        : [];
    return [
      ...allOptions,
      ...(assetsData.value
        .find((item) => item.title === props.title)
        ?.children.map((item) => {
          return {
            label: item.title,
            value: item.groupId
          };
        })
        .filter((item) => item.value !== -2) ?? [])
    ];
  });

  const formRef = ref<FormInstance>();

  // 表单验证规则
  const assetsCloudRules = ref<FormRules>({
    fileType: [{ required: true, message: "请选择资产类型", trigger: "change" }],
    file: [{ required: true, message: "请上传文件", trigger: "change" }],
    name: [
      { required: true, message: "请输入资产名称", trigger: "blur" },
      { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" }
    ]
  });

  const localAssetsRules = ref<FormRules>({
    fileType: [{ required: true, message: "请选择资产类型", trigger: "change" }],
    file: [{ required: true, message: "请上传文件", trigger: "change" }]
  });

  const form = ref<Form>({
    name: "",
    resourceType: props.availableResourceType[0],
    groupId: 0,
    fileType: FileTypeEnum.personalScreen,
    coverFile: null,
    coverFileUrl: null,
    file: [],
    fileUrl: null,
    applicationCode: BaseName.AppCode
  });

  // 预览图片数组
  const previewImages = ref<PreviewImage[]>([]);
  const coverPreviewImages = ref<PreviewImage[]>([]);

  /** 正在处理中的选文件流程（含图片压缩 await），上传前需等待其结束，避免预览列表未就绪时误判单文件 */
  let fileChangeInFlight: Promise<void> | null = null;

  // 重置表单
  const resetFromData = () => {
    handleRemoveFile();
    form.value = {
      name: "",
      resourceType: props.availableResourceType[0],
      groupId: 0,
      fileType: props.fileType,
      coverFile: null,
      coverFileUrl: null,
      file: [],
      fileUrl: null,
      applicationCode: BaseName.AppCode
    };
    previewImages.value = [];

    formRef.value?.clearValidate();
  };
  // 清除上传的存储内容
  const handleRemoveFile = () => {
    form.value.file = [];
    form.value.name = "";
    form.value.fileUrl = null;

    form.value.coverFile = null;
    form.value.coverFileUrl = null;
    previewImages.value = [];
    coverPreviewImages.value = [];
  };

  // 删除单个预览图片
  const handleDeletePreviewImage = (index: number) => {
    previewImages.value.splice(index, 1);
    if (Array.isArray(form.value.file)) {
      form.value.file.splice(index, 1);
    }
  };

  // 替换单个预览图片
  const handleReplacePreviewImage = (index: number, file: File) => {
    if (index >= 0 && index < previewImages.value.length) {
      // 释放旧的 URL
      URL.revokeObjectURL(previewImages.value[index].previewUrl);

      // 创建新的预览
      const previewUrl = URL.createObjectURL(file);
      previewImages.value[index] = {
        file: file,
        previewUrl: previewUrl,
        title: file.name
      };

      // 更新 form 中的文件
      if (Array.isArray(form.value.file)) {
        form.value.file[index] = file;
      }
    }
  };

  const handleFileChange = async (fileArray: File[]) => {
    const task = (async () => {
      if (fileArray && fileArray.length > 0) {
        // 清空之前的数据
        previewImages.value = [];
        form.value.file = [];

        for (let i = 0; i < fileArray.length; i++) {
          const file = fileArray[i];
          // 存储文件到表单
          if (Array.isArray(form.value.file)) {
            form.value.file.push(file);
          }

          // 如果是第一个文件且名称为空,使用其名称作为资产名称
          if (i === 0 && !form.value.name) {
            form.value.name = file.name.split(".")[0];
          }

          // 创建预览URL并存储
          const previewUrl = URL.createObjectURL(file);

          let itemFile = file;

          if (form.value.resourceType === ResourceTypeEnum.image) {
            itemFile = await batchCompressPic(file as File, 4);
          }
          console.log("handleFileChange task", itemFile);
          previewImages.value.push({
            file: itemFile,
            previewUrl: previewUrl,
            title: file.name
          });
        }
      }
    })();

    const tracked = task.finally(() => {
      if (fileChangeInFlight === tracked) {
        fileChangeInFlight = null;
      }
    });
    fileChangeInFlight = tracked;
    await task;
  };

  // 处理上传 - 批量上传
  const handleUpload = async (): Promise<UploadResult> => {
    if (fileChangeInFlight) {
      await fileChangeInFlight;
    }

    if (!hasPreviewImages()) {
      return createErrorResult("请选择要上传的文件");
    }

    try {
      const assetsClass = assetsClassManager.getAssetsClassByTitle(props.title);
      const uploadResults = await uploadAllFiles(assetsClass);

      return createUploadSummary(uploadResults);
    } catch (error: any) {
      return createErrorResult(error.message || "上传失败");
    }
  };

  // 检查是否有预览图片
  const hasPreviewImages = (): boolean => previewImages.value && previewImages.value.length > 0;

  // 创建错误结果
  const createErrorResult = (message: string): UploadResult => ({
    success: false,
    message
  });

  // 上传所有文件
  const uploadAllFiles = async (assetsClass: any): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    for (const previewImage of previewImages.value) {
      const result = await uploadSingleFile(assetsClass, previewImage);
      if (result) {
        results.push(result);
      }
    }

    return results;
  };

  // 上传单个文件
  const uploadSingleFile = async (assetsClass: any, previewImage: PreviewImage): Promise<UploadResult | null> => {
    const uploadParams = buildUploadParams(previewImage);
    const result = await assetsClass.uploadAsset(uploadParams);
    if (!result.success) {
      logUploadFailure(previewImage.file, result.message);
      return null;
    }

    return result;
  };

  // 构建上传参数
  const buildUploadParams = (previewImage: PreviewImage): any => {
    const file = previewImage.file;
    const isSingleFile = previewImages.value.length === 1;

    return {
      name: resolveFileName(file, isSingleFile),
      resourceType: form.value.resourceType,
      fileType: form.value.fileType,
      groupId: form.value.groupId === 0 ? "" : form.value.groupId,
      applicationCode: form.value.applicationCode,
      largeId: navInfo.value.id,
      id: form.value.id || undefined,
      ...resolveFilePayload(file)
    };
  };

  // 解析文件名：单文件优先使用用户输入，多文件使用各自文件名
  const resolveFileName = (file: File | null, isSingleFile: boolean): string => {
    if (isSingleFile) {
      return form.value.name || (file ? file.name.split(".")[0] : "");
    }
    return file ? file.name.split(".")[0] : form.value.name;
  };

  // 解析文件载荷：区分新增/编辑模式
  const resolveFilePayload = (file: File | null) => {
    const isAddMode = editType.value === EditTypeEnum.add;

    if (isAddMode || file) {
      return { file };
    }

    return { fileUrl: form.value.fileUrl };
  };

  // 记录上传失败
  const logUploadFailure = (file: File | null, message: string): void => {
    const fileName = file ? file.name : form.value.name;
    console.error(`文件 ${fileName} 上传失败:`, message);
    ElMessage.error(`文件 ${fileName} 上传失败: ${message}`);
  };

  // 创建上传汇总结果
  const createUploadSummary = (results: UploadResult[]): UploadResult => {
    if (results.length === 0) {
      return createErrorResult("所有文件上传失败");
    }

    return {
      success: true,
      message:
        results && results.length > 0
          ? results[0].message
          : `成功上传 ${results.length}/${previewImages.value.length} 个文件`,
      data: results
    };
  };

  const setForm = async (option: propOptionType) => {
    form.value = {
      name: option.name || "",
      resourceType: option.resourceType,
      groupId: props.groupId || 0,
      fileType: props.fileType,
      id: option.id,
      coverFile: null,
      coverFileUrl: option.coverFileUrl,
      file: [],
      fileUrl: option.fileUrl,
      applicationCode: BaseName.AppCode
    };
    previewImages.value = [];
    coverPreviewImages.value = [];

    // 处理文件回显（编辑模式下不需要重新创建 File 对象）
    if (option.fileUrl) {
      const fileName = option.name || "file";
      previewImages.value.push({
        file: null, // 编辑模式下不需要 File 对象
        previewUrl: option.fileUrl,
        title: fileName
      });
    }
  };

  onMounted(() => {
    if (!props.option.id) {
      editType.value = EditTypeEnum.add;
      resetFromData();
    } else {
      editType.value = EditTypeEnum.edit;
      setForm(props.option);
    }
  });

  return {
    editType,
    form,
    formRef,
    assetsCloudRules,
    localAssetsRules,
    groupOptions,
    previewImages,
    handleFileChange,
    handleRemoveFile,
    handleDeletePreviewImage,
    handleReplacePreviewImage,
    resetFromData,
    handleUpload
  };
};
