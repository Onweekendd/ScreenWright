import type { BaseEntity } from "@/model/BaseEntity";
import type { memberListRes, queryPageInvitationReq, queryPageInvitationRes, TeamListReq } from "@/model/Team";
import { BaseName } from "@/utils/config";
import { request } from "@/utils/service";

const { WEB_APP_MINIO_BASE_URL } = (window as any).webconfig;
const { MINIO_BASE_URL } = process.env;
// 获取团队成员-列表
export const getMemberList = (data: TeamListReq) =>
  request<memberListRes>({
    url: `${BaseName.System}/largeScreenMember/largeScreenMemberList`,
    method: "post",
    data
  });
// 获取团队成员-邀请成员列表
export const getMemberInvitedList = (data: TeamListReq) =>
  request<memberListRes>({
    url: `${BaseName.System}/largeScreenMember/invitedList`,
    method: "post",
    data
  });

// 审核通过
export const getMemberPass = (teamInfoId: string | number) =>
  request<BaseEntity<null>>({
    url: `${BaseName.System}/largeScreenMember/pass/${teamInfoId}`,
    method: "get",
    params: { teamInfoId }
  });

// 删除团队成员
export const deleteMember = (id: string | number) =>
  request<BaseEntity<null>>({
    url: `${BaseName.System}/largeScreenMember/delete/${id}`,
    method: "delete",
    params: { id }
  });
// 判断 邀请码是否存在
export const itExistsMember = (invitationCode: string) =>
  request<BaseEntity<boolean>>({
    url: `${BaseName.System}/largeScreenMember/itExists/${invitationCode}`,
    method: "get",
    params: { invitationCode }
  });

// 邀请
export const getMemberInvitation = (invitationCode: string) =>
  request<BaseEntity<boolean>>({
    url: `${BaseName.System}/largeScreenMember/invitation/${invitationCode}`,
    method: "get",
    params: { invitationCode }
  });

// 导入导出
export const queryPageInvitation = (params: queryPageInvitationReq) =>
  request<queryPageInvitationRes>({
    url: `${BaseName.System}/processLog/queryPage`,
    method: "post",
    data: params
  });

export const getZipFile = (url: string) =>
  request<{ data: any }>({
    url: (WEB_APP_MINIO_BASE_URL || MINIO_BASE_URL) + url,
    method: "get",
    timeout: 0,
    responseType: "blob"
  });
