import type { BaseEntity } from "@/model/BaseEntity";
import type { InterfaceDebuggerReq, InterfaceDebuggerRes, SaveInterReq } from "@/model/InterfaceDebugger";
import { BaseName } from "@/utils/config";
import { request } from "@/utils/service";

export const getInterfaceDebugger = (data: InterfaceDebuggerReq) =>
  request<InterfaceDebuggerRes>({
    url: `${BaseName.System}/interface-debugger/list`,
    method: "post",
    data,
    showLoading: true
  });
export const saveInterfaceDebugger = (data: SaveInterReq) =>
  request<BaseEntity<SaveInterReq>>({
    url: `${BaseName.System}/interface-debugger/save`,
    method: "post",
    data,
    showLoading: true
  });
export const delInterfaceDebugger = (id: string | number) =>
  request<BaseEntity<SaveInterReq>>({
    url: `${BaseName.System}/interface-debugger/delete/${id}`,
    method: "DELETE",
    showLoading: true
  });
export const updateInterfaceDebugger = (data: SaveInterReq) =>
  request<BaseEntity<SaveInterReq>>({
    url: `${BaseName.System}/interface-debugger/update`,
    method: "PUT",
    data,
    showLoading: true
  });

export const copyInterfaceDebugger = (id: string | number) =>
  request<BaseEntity<string>>({
    url: `${BaseName.System}/interface-debugger/copy/${id}?id=${id}&applicationCode=BI`,
    method: "GET",
    showLoading: true
  });
