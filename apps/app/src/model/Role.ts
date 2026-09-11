import type { BaseEntity } from "./BaseEntity";

interface RoleAuthorization {
  applicationCode: string;
  roleName: string;
  endTime: string;
}

export interface UserRoleEquities {
  largeScreenNum: number;
  sceneNum: number;
  resourceCapacity: number;
  exportLargeScreenNum: number;
  exportSceneNum: number;
  uePlug: boolean;
  chatPlug: boolean;
  watermark: boolean;
  cityScenesNum: number;
  exportCityScenesNum: number;
  cityWatermark: boolean;
  roleAuthorizationList: RoleAuthorization[];
  userInfo: {
    roleAuthorizationList: RoleAuthorization[];
  };
}

export class UserRoleModel implements UserRoleEquities {
  largeScreenNum: number;
  sceneNum: number;
  resourceCapacity: number;
  exportLargeScreenNum: number;
  exportSceneNum: number;
  uePlug: boolean;
  chatPlug: boolean;
  watermark: boolean;
  cityScenesNum: number;
  exportCityScenesNum: number;
  cityWatermark: boolean;
  roleAuthorizationList: RoleAuthorization[];
  userInfo: {
    roleAuthorizationList: RoleAuthorization[];
  };

  constructor(data: Partial<UserRoleEquities> = {}) {
    this.largeScreenNum = data.largeScreenNum ?? 0;
    this.sceneNum = data.sceneNum ?? 0;
    this.resourceCapacity = data.resourceCapacity ?? 0;
    this.exportLargeScreenNum = data.exportLargeScreenNum ?? 0;
    this.exportSceneNum = data.exportSceneNum ?? 0;
    this.uePlug = data.uePlug ?? false;
    this.chatPlug = data.chatPlug ?? false;
    this.watermark = data.watermark ?? false;
    this.cityScenesNum = data.cityScenesNum ?? 0;
    this.exportCityScenesNum = data.exportCityScenesNum ?? 0;
    this.cityWatermark = data.cityWatermark ?? false;
    this.roleAuthorizationList = data.roleAuthorizationList ?? [];
    this.userInfo = data.userInfo ?? { roleAuthorizationList: [] };
  }
}

export type UserRoleRes = BaseEntity<UserRoleEquities>;
