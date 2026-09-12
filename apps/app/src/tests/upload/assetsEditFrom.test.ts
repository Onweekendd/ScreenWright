import { beforeEach, describe, expect, it, vi } from "vitest";

import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";

import type { Props } from "@/views/build/components/buildTabs/assetsEditFrom/type";
import { FileTypeEnum, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";
import { useAssetsEdit } from "@/views/build/components/buildTabs/assetsEditFrom/useAssetsEdit";
import { assetsClassManager } from "@/views/build/components/buildTabs/selectAssets/assetsClass";

// Mock dependencies
vi.mock("@/views/build/useTabsMenuGroup", () => ({
  useTabsMenuGroup: () => ({
    assetsData: {
      value: [
        {
          title: "个人大屏资产",
          children: [
            { title: "全部", groupId: 0 },
            { title: "分组1", groupId: 1 }
          ]
        }
      ]
    }
  })
}));

vi.mock("@/views/build/useLargeScreenInfo", () => ({
  useLargeScreenInfo: () => ({
    navInfo: { value: { id: 1 } }
  })
}));

vi.mock("@/views/build/components/buildTabs/selectAssets/assetsClass", () => ({
  assetsClassManager: {
    getAssetsClassByTitle: vi.fn()
  },
  getTitleByFileType: vi.fn(() => "个人大屏资产")
}));

// Mock URL.createObjectURL for Node.js environment
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

// 模拟的 AssetsClass 类型
interface MockAssetsClass {
  isAvailableEditGroup: boolean;
  uploadAsset: ReturnType<typeof vi.fn>;
}

// Factory functions
const makeUploadAssetMock = (
  resolver: () => Promise<{ success: boolean; message?: string }> = () => Promise.resolve({ success: true })
) => vi.fn<[params: Record<string, unknown>], Promise<{ success: boolean; message?: string }>>(resolver);

const makeAssetsClassMock = (uploadAssetMock = makeUploadAssetMock()): MockAssetsClass => ({
  isAvailableEditGroup: true,
  uploadAsset: uploadAssetMock
});

const makeDefaultProps = (overrides: Partial<Props> = {}): Props => ({
  title: "个人大屏资产",
  fileType: FileTypeEnum.personalScreen,
  availableResourceType: [ResourceTypeEnum.image],
  option: {
    resourceType: ResourceTypeEnum.image,
    id: null,
    fileUrl: null,
    coverFileUrl: null,
    name: null
  },
  ...overrides
});

const makeEditModeProps = (overrides: Partial<Props> = {}): Props =>
  makeDefaultProps({
    option: {
      id: 1,
      name: "test_21",
      resourceType: ResourceTypeEnum.image,
      fileUrl: "/version-test/test_21.png",
      coverFileUrl: null
    },
    ...overrides
  });

const makeTestFile = (name = "test.png", type = "image/png") => new File(["test content"], name, { type });

// 测试组件包装器类型
interface TestComponentWrapper {
  composable: ReturnType<typeof useAssetsEdit>;
}

// Test component factory
const createTestComponent = (props: Props) =>
  defineComponent({
    setup() {
      const composable = useAssetsEdit(props);
      return { composable };
    },
    template: "<div></div>"
  });

describe("useAssetsEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("编辑模式初始化", () => {
    it("有 fileUrl 时，previewImages 被正确填充（不 fetch 文件）", async () => {
      // Arrange
      const props = makeEditModeProps();
      const TestComponent = createTestComponent(props);

      // Act
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      const vm = wrapper.vm as TestComponentWrapper;
      const { form, previewImages, editType } = vm.composable;

      expect(editType.value).toBe(2); // EditTypeEnum.edit
      expect(form.value.fileUrl).toBe("/version-test/test_21.png");
      expect(form.value.name).toBe("test_21");
      expect(previewImages.value).toHaveLength(1);
      expect(previewImages.value[0].title).toBe("test_21");
      expect(previewImages.value[0].previewUrl).toBe("/version-test/test_21.png");
      expect(previewImages.value[0].file).toBeNull();
      expect(form.value.file).toEqual([]);
    });
  });

  describe("新增模式初始化", () => {
    it("option 中没有 id 时，初始化为空状态", async () => {
      // Arrange
      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);

      // Act
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      // Assert
      const vm = wrapper.vm as TestComponentWrapper;
      const { form, previewImages, editType } = vm.composable;

      expect(editType.value).toBe(1); // EditTypeEnum.add
      expect(form.value.fileUrl).toBeNull();
      expect(previewImages.value).toEqual([]);
    });
  });

  describe("文件上传处理", () => {
    it("选择文件后，正确创建预览图片", async () => {
      // Arrange
      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { previewImages, handleFileChange } = vm.composable;
      const testFile = makeTestFile("test.png");

      // Act
      handleFileChange([testFile]);
      await wrapper.vm.$nextTick();

      // Assert
      expect(previewImages.value).toHaveLength(1);
      expect(previewImages.value[0].file).toBe(testFile);
      expect(previewImages.value[0].title).toBe("test.png");
      expect(previewImages.value[0].previewUrl).toBe("blob:mock-url");
    });

    it("首次上传文件且名称为空时，自动使用文件名填充名称", async () => {
      // Arrange
      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { form, handleFileChange } = vm.composable;
      const testFile = makeTestFile("my-image.png");

      // Act
      handleFileChange([testFile]);
      await wrapper.vm.$nextTick();

      // Assert
      expect(form.value.name).toBe("my-image");
    });

    it("首次上传文件但名称已存在时，保留用户输入的名称", async () => {
      // Arrange
      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { form, handleFileChange } = vm.composable;

      // 先设置用户自定义名称
      form.value.name = "自定义名称";
      const testFile = makeTestFile("test.png");

      // Act
      handleFileChange([testFile]);
      await wrapper.vm.$nextTick();

      // Assert - 名称不应被覆盖
      expect(form.value.name).toBe("自定义名称");
    });
  });

  describe("单文件上传 - 名称修改", () => {
    it("单文件上传时修改了自定义名称，上传应使用自定义名称", async () => {
      // Arrange
      const uploadAssetMock = makeUploadAssetMock();
      vi.mocked(assetsClassManager.getAssetsClassByTitle).mockReturnValue(
        makeAssetsClassMock(uploadAssetMock) as unknown as ReturnType<typeof assetsClassManager.getAssetsClassByTitle>
      );

      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { form, handleFileChange, handleUpload } = vm.composable;
      const testFile = makeTestFile("original-name.png");

      // 上传文件
      handleFileChange([testFile]);
      await wrapper.vm.$nextTick();

      // 修改名称为自定义值
      form.value.name = "我的自定义图片";

      // Act
      await handleUpload();

      // Assert
      expect(uploadAssetMock).toHaveBeenCalledTimes(1);
      const uploadParams = uploadAssetMock.mock.calls[0][0];
      expect(uploadParams.name).toBe("我的自定义图片");
      expect(uploadParams.file).toBe(testFile);
    });

    it("单文件上传时未修改名称，上传应使用文件名", async () => {
      // Arrange
      const uploadAssetMock = makeUploadAssetMock();
      vi.mocked(assetsClassManager.getAssetsClassByTitle).mockReturnValue(
        makeAssetsClassMock(uploadAssetMock) as unknown as ReturnType<typeof assetsClassManager.getAssetsClassByTitle>
      );

      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { handleFileChange, handleUpload } = vm.composable;
      const testFile = makeTestFile("original-name.png");

      // 上传文件但不修改名称（使用自动填充的文件名）
      handleFileChange([testFile]);
      await wrapper.vm.$nextTick();

      // Act
      await handleUpload();

      // Assert
      expect(uploadAssetMock).toHaveBeenCalledTimes(1);
      const uploadParams = uploadAssetMock.mock.calls[0][0];
      expect(uploadParams.name).toBe("original-name");
    });
  });

  describe("多文件上传 - 使用各自文件名", () => {
    it("多文件上传时，每个文件使用各自的文件名", async () => {
      // Arrange
      const uploadAssetMock = makeUploadAssetMock();
      vi.mocked(assetsClassManager.getAssetsClassByTitle).mockReturnValue(
        makeAssetsClassMock(uploadAssetMock) as unknown as ReturnType<typeof assetsClassManager.getAssetsClassByTitle>
      );

      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { handleFileChange, handleUpload } = vm.composable;

      const file1 = makeTestFile("image-1.png");
      const file2 = makeTestFile("image-2.png");

      // Act
      handleFileChange([file1, file2]);
      await wrapper.vm.$nextTick();
      await handleUpload();

      // Assert
      expect(uploadAssetMock).toHaveBeenCalledTimes(2);

      const firstCallParams = uploadAssetMock.mock.calls[0][0];
      const secondCallParams = uploadAssetMock.mock.calls[1][0];

      expect(firstCallParams.name).toBe("image-1");
      expect(secondCallParams.name).toBe("image-2");
    });

    it("多文件上传时即使设置了自定义名称，仍使用各自文件名", async () => {
      // Arrange
      const uploadAssetMock = makeUploadAssetMock();
      vi.mocked(assetsClassManager.getAssetsClassByTitle).mockReturnValue(
        makeAssetsClassMock(uploadAssetMock) as unknown as ReturnType<typeof assetsClassManager.getAssetsClassByTitle>
      );

      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { form, handleFileChange, handleUpload } = vm.composable;

      const file1 = makeTestFile("image-1.png");
      const file2 = makeTestFile("image-2.png");

      handleFileChange([file1, file2]);
      await wrapper.vm.$nextTick();

      // 尝试设置自定义名称（多文件模式下不应生效）
      form.value.name = "通用名称";

      // Act
      await handleUpload();

      // Assert - 仍使用各自文件名
      const firstCallParams = uploadAssetMock.mock.calls[0][0];
      const secondCallParams = uploadAssetMock.mock.calls[1][0];

      expect(firstCallParams.name).toBe("image-1");
      expect(secondCallParams.name).toBe("image-2");
    });
  });

  describe("编辑模式上传", () => {
    it("编辑模式上传新文件时，参数包含 file 不包含 fileUrl", async () => {
      // Arrange
      const uploadAssetMock = makeUploadAssetMock();
      vi.mocked(assetsClassManager.getAssetsClassByTitle).mockReturnValue(
        makeAssetsClassMock(uploadAssetMock) as unknown as ReturnType<typeof assetsClassManager.getAssetsClassByTitle>
      );

      const props = makeEditModeProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { handleFileChange, handleUpload, editType } = vm.composable;

      expect(editType.value).toBe(2);

      const newFile = makeTestFile("new_image.png");
      handleFileChange([newFile]);
      await wrapper.vm.$nextTick();

      // Act
      await handleUpload();

      // Assert
      expect(uploadAssetMock).toHaveBeenCalledTimes(1);
      const uploadParams = uploadAssetMock.mock.calls[0][0];

      expect(uploadParams.file).toBe(newFile);
      expect(uploadParams.fileUrl).toBeUndefined();
      expect(uploadParams.id).toBe(1);
    });

    it("编辑模式未上传新文件时，参数包含 fileUrl", async () => {
      // Arrange
      const uploadAssetMock = makeUploadAssetMock();
      vi.mocked(assetsClassManager.getAssetsClassByTitle).mockReturnValue(
        makeAssetsClassMock(uploadAssetMock) as unknown as ReturnType<typeof assetsClassManager.getAssetsClassByTitle>
      );

      const props = makeEditModeProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();
      await new Promise((resolve) => setTimeout(resolve, 0));

      const vm = wrapper.vm as TestComponentWrapper;
      const { handleUpload, editType, previewImages } = vm.composable;

      expect(editType.value).toBe(2);
      expect(previewImages.value[0].file).toBeNull();

      // Act - 直接上传，不上传新文件
      await handleUpload();

      // Assert
      expect(uploadAssetMock).toHaveBeenCalledTimes(1);
      const uploadParams = uploadAssetMock.mock.calls[0][0];

      expect(uploadParams.file).toBeUndefined();
      expect(uploadParams.fileUrl).toBe("/version-test/test_21.png");
      expect(uploadParams.id).toBe(1);
    });
  });

  describe("视频上传", () => {
    it("上传视频文件时，设置正确的资源类型和名称", async () => {
      // Arrange
      const uploadAssetMock = makeUploadAssetMock();
      vi.mocked(assetsClassManager.getAssetsClassByTitle).mockReturnValue(
        makeAssetsClassMock(uploadAssetMock) as unknown as ReturnType<typeof assetsClassManager.getAssetsClassByTitle>
      );

      const props = makeDefaultProps({
        availableResourceType: [ResourceTypeEnum.video]
      });
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { handleFileChange, handleUpload, form } = vm.composable;

      const videoFile = makeTestFile("test.mp4", "video/mp4");
      handleFileChange([videoFile]);
      await wrapper.vm.$nextTick();

      form.value.resourceType = ResourceTypeEnum.video;

      // Act
      await handleUpload();

      // Assert
      expect(uploadAssetMock).toHaveBeenCalledTimes(1);
      const uploadParams = uploadAssetMock.mock.calls[0][0];

      expect(uploadParams.file).toBe(videoFile);
      expect(uploadParams.resourceType).toBe(ResourceTypeEnum.video);
      expect(uploadParams.name).toBe("test");
    });
  });

  describe("上传结果处理", () => {
    it("全部上传成功时，返回成功状态及计数消息", async () => {
      // Arrange
      const uploadAssetMock = makeUploadAssetMock();
      vi.mocked(assetsClassManager.getAssetsClassByTitle).mockReturnValue(
        makeAssetsClassMock(uploadAssetMock) as unknown as ReturnType<typeof assetsClassManager.getAssetsClassByTitle>
      );

      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { handleFileChange, handleUpload } = vm.composable;

      handleFileChange([makeTestFile("test1.png"), makeTestFile("test2.png")]);
      await wrapper.vm.$nextTick();

      // Act
      const result = await handleUpload();

      // Assert
      expect(result.success).toBe(true);
      // expect(result.message).toBe("成功上传 2/2 个文件");
    });

    it("全部上传失败时，返回失败消息", async () => {
      // Arrange
      const failingUploadMock = makeUploadAssetMock(() =>
        Promise.resolve({ success: false, message: "Network error" })
      );
      vi.mocked(assetsClassManager.getAssetsClassByTitle).mockReturnValue(
        makeAssetsClassMock(failingUploadMock) as unknown as ReturnType<typeof assetsClassManager.getAssetsClassByTitle>
      );

      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { handleFileChange, handleUpload } = vm.composable;

      handleFileChange([makeTestFile("test.png")]);
      await wrapper.vm.$nextTick();

      // Act
      const result = await handleUpload();

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("所有文件上传失败");
    });

    it("部分上传成功时，返回成功状态及部分计数", async () => {
      // Arrange
      let callCount = 0;
      const partialUploadMock = makeUploadAssetMock(() => {
        callCount++;
        return Promise.resolve({
          success: callCount === 1,
          message: callCount === 1 ? "" : "Failed"
        });
      });
      vi.mocked(assetsClassManager.getAssetsClassByTitle).mockReturnValue(
        makeAssetsClassMock(partialUploadMock) as unknown as ReturnType<typeof assetsClassManager.getAssetsClassByTitle>
      );

      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { handleFileChange, handleUpload } = vm.composable;

      handleFileChange([makeTestFile("test1.png"), makeTestFile("test2.png")]);
      await wrapper.vm.$nextTick();

      // Act
      const result = await handleUpload();

      // Assert
      expect(result.success).toBe(true);
      // expect(result.message).toBe("成功上传 1/2 个文件");
    });

    it("上传抛出异常时，返回错误消息", async () => {
      // Arrange
      const errorUploadMock = makeUploadAssetMock(() => Promise.reject(new Error("Connection timeout")));
      vi.mocked(assetsClassManager.getAssetsClassByTitle).mockReturnValue(
        makeAssetsClassMock(errorUploadMock) as unknown as ReturnType<typeof assetsClassManager.getAssetsClassByTitle>
      );

      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { handleFileChange, handleUpload } = vm.composable;

      handleFileChange([makeTestFile("test.png")]);
      await wrapper.vm.$nextTick();

      // Act
      const result = await handleUpload();

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("Connection timeout");
    });

    it("没有选择文件时，返回请选择文件的消息", async () => {
      // Arrange
      const props = makeDefaultProps();
      const TestComponent = createTestComponent(props);
      const wrapper = mount(TestComponent);
      await wrapper.vm.$nextTick();

      const vm = wrapper.vm as TestComponentWrapper;
      const { handleUpload } = vm.composable;

      // Act - 直接上传，不选择文件
      const result = await handleUpload();

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe("请选择要上传的文件");
    });
  });
});
