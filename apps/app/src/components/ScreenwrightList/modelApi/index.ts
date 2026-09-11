import type { updateModelReq } from "@/model/DataModel";
import type { ScreenVersion } from "@/model/Version";
import type { ScreenReq } from "@/model/Visual";

import { DisplayApi } from "./displayApi";

class ModelApi {
  private displayApi: DisplayApi;
  private path: string;
  constructor(path: string) {
    this.path = path;
    this.displayApi = new DisplayApi();
  }
  getScreenModule(data: { size: number; current: number; stockType: number }) {
    if (this.path === "/display") {
      return this.displayApi.getScreenModule(data);
    }
    return Promise.resolve();
  }
  getScreenList(data: ScreenReq) {
    if (this.path === "/display") {
      return this.displayApi.getScreenList(data);
    }
    return Promise.resolve();
  }
  addScreenData(data: any) {
    if (this.path === "/display") {
      return this.displayApi.addScreenData(data);
    }
    return Promise.resolve();
  }
  copyScreenObj(params: { id: string | number; versionCode: string }) {
    if (this.path === "/display") {
      return this.displayApi.copyScreenObj(params);
    }
    return Promise.resolve();
  }
  getScreenVersionList(id: string | number) {
    if (this.path === "/display") {
      return this.displayApi.getScreenVersionList(id);
    } else if (this.path.includes("/build")) {
      return this.displayApi.getScreenVersionList(id);
    }
    return Promise.resolve();
  }
  // 发布函数
  publishScreenVersion(params: ScreenVersion) {
    if (this.path === "/display") {
      return this.displayApi.publishScreen(params);
    } else if (this.path.includes("/build")) {
      return this.displayApi.publishScreen(params);
    }
    return Promise.resolve();
  }
  // 编辑函数
  updateScreenData(data: updateModelReq) {
    if (this.path === "/display") {
      return this.displayApi.updateScreenData(data);
    }
    return Promise.resolve();
  }
  // 删除函数
  deleteScreenObj(id: string | number) {
    if (this.path === "/display") {
      return this.displayApi.deleteScreenObj(id);
    }
    return Promise.resolve();
  }
}

export { ModelApi };
