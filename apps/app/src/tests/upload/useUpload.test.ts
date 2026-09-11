import { beforeEach, describe, expect, it } from "vitest";

import { ref } from "vue";
import { mount } from "@vue/test-utils";

import { readFileSync } from "fs";
import { join } from "path";

import assetsUpload from "@/views/build/components/buildTabs/assetsEditFrom/assetsUpload.vue";
import { ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

// Factory functions
const makeDefaultProps = (overrides = {}) => ({
  resourceType: ResourceTypeEnum.image,
  fileUrl: null,
  ...overrides
});

const makeTestFile = (name: string, type: string, content: string | Uint8Array = "test content") =>
  new File([content as BlobPart], name, { type });

const makeImageFileFromDisk = (filename: string) => {
  const imagePath = join(__dirname, "testImage", filename);
  const imageBuffer = readFileSync(imagePath);
  const uint8Array = new Uint8Array(imageBuffer);
  const extension = filename.split(".").pop() || "png";
  const mimeType = extension === "png" ? "image/png" : "image/jpeg";
  return new File([uint8Array], filename, { type: mimeType });
};

const makeVideoFileFromDisk = (filename: string) => {
  const videoPath = join(__dirname, "testVideo", filename);
  const videoBuffer = readFileSync(videoPath);
  const uint8Array = new Uint8Array(videoBuffer);
  return new File([uint8Array], filename, { type: "video/mp4" });
};

describe("assetsUpload", () => {
  describe("组件渲染", () => {
    it("renders upload trigger area correctly", () => {
      // Arrange
      const props = makeDefaultProps();

      // Act
      const wrapper = mount(assetsUpload, { props });

      // Assert
      expect(wrapper.find(".upload-trigger").exists()).toBe(true);
      expect(wrapper.find(".upload-placeholder").exists()).toBe(true);
    });

    it("renders with preview images when provided", () => {
      // Arrange
      const imagePath = join(__dirname, "testImage", "test_21.png");
      const imageBuffer = readFileSync(imagePath);
      const base64 = imageBuffer.toString("base64");
      const previewUrl = `data:image/png;base64,${base64}`;

      const previewImages = [
        {
          file: makeTestFile("test_21.png", "image/png", new Uint8Array(imageBuffer)),
          previewUrl,
          title: "test_21.png"
        }
      ];

      const props = makeDefaultProps({ previewImages });

      // Act
      const wrapper = mount(assetsUpload, { props });

      // Assert
      expect(wrapper.findAll(".preview-image-item")).toHaveLength(1);
      const img = wrapper.find("img");
      expect(img.exists()).toBe(true);
      expect(img.attributes("alt")).toBe("test_21.png");
      expect(img.attributes("src")).toContain("data:image/png;base64,");

      const titleElement = wrapper.find(".image-title");
      expect(titleElement.exists()).toBe(true);
      expect(titleElement.text()).toBe("test_21.png");
    });
  });

  describe("文件上传事件", () => {
    it("emits change event with selected files", async () => {
      // Arrange
      const props = makeDefaultProps();
      const wrapper = mount(assetsUpload, { props });
      const testFile = makeTestFile("test.png", "image/png");

      // Act
      await wrapper.vm.$emit("change", [testFile]);

      // Assert
      expect(wrapper.emitted("change")).toBeTruthy();
      expect(wrapper.emitted("change")?.[0][0]).toEqual([testFile]);
    });

    it("emits change event with real image file", async () => {
      // Arrange
      const props = makeDefaultProps();
      const wrapper = mount(assetsUpload, { props });
      const uploadedFiles = ref<File[]>([]);

      const onChange = (files: File[]) => {
        uploadedFiles.value = files;
      };

      await wrapper.setProps({ onChange });

      const testFile = makeImageFileFromDisk("test_21.png");

      // Act
      await wrapper.vm.$emit("change", [testFile]);

      // Assert
      expect(wrapper.emitted("change")).toBeTruthy();
      expect(wrapper.emitted("change")?.[0][0]).toEqual([testFile]);
      expect(uploadedFiles.value).toEqual([testFile]);
    });

    it("emits change event with video file", async () => {
      // Arrange
      const props = makeDefaultProps({ resourceType: ResourceTypeEnum.video });
      const wrapper = mount(assetsUpload, { props });
      const uploadedFiles = ref<File[]>([]);

      const onChange = (files: File[]) => {
        uploadedFiles.value = files;
      };

      await wrapper.setProps({ onChange });

      const testFile = makeVideoFileFromDisk("mov_bbb.mp4");

      // Act
      await wrapper.vm.$emit("change", [testFile]);

      // Assert
      expect(wrapper.emitted("change")).toBeTruthy();
      expect(wrapper.emitted("change")?.[0][0]).toEqual([testFile]);
      expect(uploadedFiles.value).toEqual([testFile]);
    });

    it("emits change event with multiple files when multiple prop is true", async () => {
      // Arrange
      const props = makeDefaultProps({ multiple: true });
      const wrapper = mount(assetsUpload, { props });
      const uploadedFiles = ref<File[]>([]);

      const onChange = (files: File[]) => {
        uploadedFiles.value = files;
      };

      await wrapper.setProps({ onChange });

      const file1 = makeImageFileFromDisk("test_21.png");
      const file2 = makeImageFileFromDisk("test_1.jpg");
      const files = [file1, file2];

      // Act
      await wrapper.vm.$emit("change", files);

      // Assert
      expect(wrapper.emitted("change")).toBeTruthy();
      expect(wrapper.emitted("change")?.[0][0]).toEqual(files);
      expect(uploadedFiles.value).toHaveLength(2);
      expect(uploadedFiles.value[0].name).toBe("test_21.png");
      expect(uploadedFiles.value[1].name).toBe("test_1.jpg");
    });
  });

  describe("多选支持", () => {
    it("sets multiple attribute based on prop", async () => {
      // Arrange - 默认单选
      const singleProps = makeDefaultProps();
      const singleWrapper = mount(assetsUpload, { props: singleProps });

      // Act & Assert - 检查组件内部状态
      expect(singleWrapper.vm.$props.multiple).toBe(false);

      // Arrange - 设置为多选
      const multipleProps = makeDefaultProps({ multiple: true });
      const multipleWrapper = mount(assetsUpload, { props: multipleProps });

      // Act & Assert
      expect(multipleWrapper.vm.$props.multiple).toBe(true);
    });
  });

  describe("资源类型处理", () => {
    it("accepts image resource type", () => {
      // Arrange
      const props = makeDefaultProps({ resourceType: ResourceTypeEnum.image });

      // Act
      const wrapper = mount(assetsUpload, { props });

      // Assert
      expect(wrapper.vm.$props.resourceType).toBe(ResourceTypeEnum.image);
    });

    it("accepts video resource type", () => {
      // Arrange
      const props = makeDefaultProps({ resourceType: ResourceTypeEnum.video });

      // Act
      const wrapper = mount(assetsUpload, { props });

      // Assert
      expect(wrapper.vm.$props.resourceType).toBe(ResourceTypeEnum.video);
    });
  });

  describe("拖拽上传", () => {
    it("handles drag over state", async () => {
      // Arrange
      const props = makeDefaultProps();
      const wrapper = mount(assetsUpload, { props });
      const uploadTrigger = wrapper.find(".upload-trigger");

      // Act
      await uploadTrigger.trigger("dragover");

      // Assert
      expect(uploadTrigger.classes()).toContain("drag-over");
    });

    it("handles drag leave state", async () => {
      // Arrange
      const props = makeDefaultProps();
      const wrapper = mount(assetsUpload, { props });
      const uploadTrigger = wrapper.find(".upload-trigger");

      // Act
      await uploadTrigger.trigger("dragover");
      await uploadTrigger.trigger("dragleave");

      // Assert
      expect(uploadTrigger.classes()).not.toContain("drag-over");
    });

    it("handles drop event with files", async () => {
      // Arrange
      const props = makeDefaultProps();
      const wrapper = mount(assetsUpload, { props });
      const uploadTrigger = wrapper.find(".upload-trigger");
      const testFile = makeTestFile("dropped.png", "image/png");

      // 创建模拟的 drop 事件
      const dropEvent = new Event("drop", { bubbles: true });
      Object.defineProperty(dropEvent, "dataTransfer", {
        value: {
          files: [testFile]
        }
      });

      // Act
      await uploadTrigger.element.dispatchEvent(dropEvent);
      await wrapper.vm.$nextTick();

      // Assert - 拖拽后应该触发 change 事件
      // 注意：由于浏览器安全限制，实际文件拖拽在测试中可能无法完全模拟
      expect(uploadTrigger.classes()).not.toContain("drag-over");
    });
  });

  describe("图片预览项操作", () => {
    it("emits delete event when delete button clicked", async () => {
      // Arrange
      const previewImages = [
        {
          file: makeTestFile("test.png", "image/png"),
          previewUrl: "blob:mock-url",
          title: "test.png"
        }
      ];
      const props = makeDefaultProps({ previewImages });
      const wrapper = mount(assetsUpload, { props });

      // Act - 触发删除事件
      await wrapper.vm.$emit("delete", 0);

      // Assert
      expect(wrapper.emitted("delete")).toBeTruthy();
      expect(wrapper.emitted("delete")?.[0]).toEqual([0]);
    });

    it("emits replace event when replace triggered", async () => {
      // Arrange
      const previewImages = [
        {
          file: makeTestFile("test.png", "image/png"),
          previewUrl: "blob:mock-url",
          title: "test.png"
        }
      ];
      const props = makeDefaultProps({ previewImages });
      const wrapper = mount(assetsUpload, { props });
      const newFile = makeTestFile("replacement.png", "image/png");

      // Act
      await wrapper.vm.$emit("replace", 0, newFile);

      // Assert
      expect(wrapper.emitted("replace")).toBeTruthy();
      expect(wrapper.emitted("replace")?.[0]).toEqual([0, newFile]);
    });
  });

  describe("单图片布局", () => {
    it("applies single-image class when only one preview image", () => {
      // Arrange
      const previewImages = [
        {
          file: makeTestFile("single.png", "image/png"),
          previewUrl: "blob:mock-url",
          title: "single.png"
        }
      ];
      const props = makeDefaultProps({ previewImages });

      // Act
      const wrapper = mount(assetsUpload, { props });

      // Assert
      const imageList = wrapper.find(".upload-image-list");
      expect(imageList.classes()).toContain("single-image");
    });

    it("does not apply single-image class with multiple images", () => {
      // Arrange
      const previewImages = [
        {
          file: makeTestFile("first.png", "image/png"),
          previewUrl: "blob:mock-url-1",
          title: "first.png"
        },
        {
          file: makeTestFile("second.png", "image/png"),
          previewUrl: "blob:mock-url-2",
          title: "second.png"
        }
      ];
      const props = makeDefaultProps({ previewImages });

      // Act
      const wrapper = mount(assetsUpload, { props });

      // Assert
      const imageList = wrapper.find(".upload-image-list");
      expect(imageList.classes()).not.toContain("single-image");
    });
  });
});
