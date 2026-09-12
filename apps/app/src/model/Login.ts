import type { BaseEntity } from "./BaseEntity";

interface RoleAuthorization {
  applicationCode: string;
  roleName: string;
  endTime: string;
}

export interface User {
  roleAuthorizationList: RoleAuthorization[];
  id: number;
  userName: string;
  type: number;
  expirationTime: string;
  status: number;
  balance: number;
  companyId: number;
  email: string;
  phone: string;
  realname: string;
  region: string;
  temporaryCompanyName: string;
  forbidden: boolean;
  role: number;
  stockType: number;
  createLarge: string;
  createScene: string;
  exportLarge: string;
  exportScene: string;
  createCity: string;
  exportCity: string;
  createdBy: string;
  createdTime: string;
  updatedBy: string;
  updatedTime: string;
}
interface LoginResult {
  token: string;
  userInfo: User;
}
export interface LoginReq {
  username: string;
  password: string;
  loginType: string;
}

export interface TreeNode {
  id: number;
  parentId: number | null;
  name: string;
  path: string;
  component: string;
  perms: string | null;
  type: number;
  hidden: boolean;
  sortValue: number;
  applicationId: number;
  createdBy: string;
  updatedBy: string;
  createdTime: string;
  updatedTime: string;
  applicationName: string | null;
  children: TreeNode[];
  check: boolean;
}

export interface TreeResult {
  id: number;
  parentId: number | null;
  name: string;
  path: string;
  component: string;
  perms: string | null;
  type: number;
  hidden: boolean;
  sortValue: number;
  applicationId: number;
  createdBy: string;
  updatedBy: string;
  createdTime: string;
  updatedTime: string;
  applicationName: string | null;
  children: TreeNode[];
  check: boolean;
  isLink?: boolean;
}
export interface loginFormProps {
  username: string;
  password: string;
  loginType: string;
}

export interface FormProps {
  password: string;
  newPassword: string;
  oldPassword?: string;
  newPasswordTwice?: string;
}

export type TreeRes = BaseEntity<Array<TreeResult>>;
export type LoginRes = BaseEntity<LoginResult>;
export type UserRes = BaseEntity<User>;
