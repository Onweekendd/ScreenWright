import type { SetupContext } from "vue";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

import type { UploadFile } from "element-plus";
import { ElMessage } from "element-plus";
import { isNil, isNull } from "lodash-es";

import { uploadMinioScene } from "@/api/assets";
import { BaseName } from "@/utils/config";
import { setMinioUrl } from "@/utils/config";
import { pipeValidator } from "@/utils/pipeValidator";
import { batchCompressPic, getCoverUrl } from "@/utils/utils";
import { FileTypeEnum, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import type { FtUploadEmits, FtUploadProps } from "./SwUpload";
import { FileType } from "./SwUpload";
// import html2canvas from "html2canvas"

type fileTypeMapProps = Record<
  FileType,
  {
    accept: string;
    resourceType: ResourceTypeEnum;
  }
>;

export const useSwUpload = (props: FtUploadProps, emit: SetupContext<FtUploadEmits>["emit"]) => {
  const route = useRoute();
  const fileUrl = ref("");
  const fileTypeMap: fileTypeMapProps = {
    img: {
      accept:
        "image/jpg,image/jpeg,image/png,image/gif,image/svg,image/xml,image/svg+xml,image/webp,image/bmp,image/tiff,image/x-icon",
      resourceType: ResourceTypeEnum.image
    },
    video: {
      accept:
        "video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/x-flv,video/x-matroska,video/3gpp",
      resourceType: ResourceTypeEnum.video
    },
    audio: {
      accept: "audio/mpeg,audio/wav,audio/ogg,audio/aac,audio/flac,audio/x-m4a,audio/x-ms-wma,audio/opus",
      resourceType: ResourceTypeEnum.video
    },
    model: {
      accept:
        "model/obj,model/gltf-binary,model/fbx,application/octet-stream,model/vnd.collada+xml,application/vnd.ms-pki.stl",
      resourceType: ResourceTypeEnum.threeModel
    },
    imgAndVideo: {
      accept:
        "image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/x-icon,video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-ms-wmv,video/x-flv,video/x-matroska,video/3gpp",
      resourceType: ResourceTypeEnum.video
    },
    file: {
      accept: ".pdf",
      resourceType: ResourceTypeEnum.video
    }
  };

  const handleScreenShot = async () => {
    if (!props.screenShot || !props.screenShotDom) return;
    const dom = document.querySelector(props.screenShotDom) as HTMLElement;
    const { url, file } = await getCoverUrl(dom, {
      width: dom.getBoundingClientRect().width,
      height: dom.getBoundingClientRect().height
    });
    if (url) {
      await onChange(file);
      // emit("screenShot", { url: url, file: file })
    }
  };

  const handleDeleteClick = () => {
    emit("update:modelValue", "");
    emit("delete", "");
  };

  const isLimitSize = (size: number) => {
    let result = true;
    const fileSize = size / 1024;
    if (props.fileSize) {
      if (!isNull(fileSize) && fileSize > props.fileSize) {
        ElMessage.error(`文件大小超出${props.fileSize / 1024}MB`);
        result = false;
      }
    }
    return result;
  };

  const isFileTypeValid = (
    file:
      | File
      | UploadFile
      | {
          name: string;
          type: string;
        }
  ) => {
    let result = true;
    const fileName = file.name;
    const fileType = (file as File).type || "";

    // 获取允许的文件类型
    let acceptTypes = "";

    if (props.accept) {
      // 如果有自定义的 accept，使用自定义的
      acceptTypes = props.accept;
    } else {
      // 否则使用默认的 fileTypeMap 中的 accept
      acceptTypes = fileTypeMap[props.fileType || FileType.img]
        ? fileTypeMap[props.fileType || FileType.img].accept
        : "";
    }

    // 检查文件类型是否匹配
    const acceptList = acceptTypes.split(",").map((type) => type.trim());
    const isTypeMatch = acceptList.some((acceptType) => {
      console.log("acceptType1", acceptType, fileType);
      console.log("acceptType2", acceptType, fileName);
      // 处理 MIME 类型匹配
      if (acceptType.includes("/")) {
        return fileType === acceptType || acceptType.includes(fileType);
      }
      // 处理文件扩展名匹配
      if (acceptType.startsWith(".")) {
        return fileName.toLowerCase().endsWith(acceptType.toLowerCase());
      }
      return false;
    });

    if (!isTypeMatch) {
      ElMessage.error(`文件类型不支持，请上传 ${acceptTypes} 格式的文件`);
      result = false;
    }

    return result;
  };

  const onChange = async (file: File | UploadFile) => {
    const result = await new pipeValidator()
      .add(() => isFileTypeValid(file))
      .add(() => isLimitSize(file.size || 0))
      .validate();
    if (!result) {
      return;
    }

    let uploadFileRaw = file;
    // 图片大类处理
    if (fileTypeMap[props.fileType || FileType.img].resourceType === ResourceTypeEnum.image) {
      uploadFileRaw = await batchCompressPic(file as File, 4);
    } else {
      // 非图片大类处理
      if (fileTypeMap.img.accept.includes((file as File).type)) {
        uploadFileRaw = await batchCompressPic(file as File, 4);
      }
    }

    console.log("uploadFileRaw", uploadFileRaw);

    const res = await uploadMinioScene({
      name: uploadFileRaw.name,
      resourceType: fileTypeMap[props.fileType || FileType.img].resourceType,
      fileType: FileTypeEnum.personalScreen,
      largeId: Array.isArray(route.params.id) ? route.params.id[0] : route.params.id,
      groupId: "",
      file: uploadFileRaw as UploadFile,
      coverFile: null,
      coverFileUrl: null,
      fileUrl: null,
      applicationCode: BaseName.AppCode
    });
    if (res.success) {
      fileUrl.value = setMinioUrl(res.result.url);

      emit("update:modelValue", res.result.url);
      emit("change", res.result);
    } else {
      ElMessage.error(res.message || "上传失败，请稍后再试");
    }
  };

  watch(
    () => props.modelValue,
    (nVal) => {
      if (isNil(nVal) || nVal === "none") {
        fileUrl.value = "";
      } else {
        if (nVal === "") {
          fileUrl.value = "";
        } else {
          if (typeof nVal === "string") {
            const isHasHttp = nVal.includes("http");
            const isBase64 = nVal.startsWith("data:") && nVal.includes(";base64,");
            if (isHasHttp || isBase64) {
              fileUrl.value = nVal;
            } else {
              fileUrl.value = setMinioUrl(nVal);
            }
          }
        }
      }
    },
    {
      immediate: true
    }
  );
  return {
    fileUrl,
    fileTypeMap,
    onChange,
    handleDeleteClick,
    handleScreenShot,
    isFileTypeValid
  };
};
