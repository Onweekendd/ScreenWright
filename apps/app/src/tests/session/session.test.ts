import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearSession,
  currentAppPath,
  handleUnauthorized,
  isPublicAppPath,
  redirectToLogin,
  safeRedirectTarget
} from "@/utils/session";

const assign = vi.fn();

const setLocation = (pathname: string, search = "") => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { pathname, search, assign }
  });
};

describe("session 工具", () => {
  beforeEach(() => {
    window.localStorage.clear();
    assign.mockClear();
    vi.stubEnv("PUBLIC_PATH", "/");
    process.env.PUBLIC_PATH = "/";
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("safeRedirectTarget", () => {
    it.each(["/build/12", "/display?tab=1", "/source"])("接受应用内路径 %s", (path) => {
      expect(safeRedirectTarget(path)).toBe(path);
    });

    it.each([
      undefined,
      null,
      123,
      "",
      "display",
      "//evil.com",
      "https://evil.com",
      "/\\evil.com",
      "/login",
      "/login?redirect=/x"
    ])("非法 / 外部 / 登录页自身的跳转目标 %j 回落到 /display", (raw) => {
      expect(safeRedirectTarget(raw)).toBe("/display");
    });
  });

  describe("isPublicAppPath", () => {
    it.each(["/login", "/login?redirect=/build/1", "/view/12", "/view/12/panel_3?version=1"])("%s 是公开页", (path) => {
      expect(isPublicAppPath(path)).toBe(true);
    });

    it.each(["/display", "/build/12", "/viewer", "/"])("%s 需要登录", (path) => {
      expect(isPublicAppPath(path)).toBe(false);
    });
  });

  describe("currentAppPath", () => {
    it("根部署：原样返回 pathname + search", () => {
      setLocation("/build/9", "?a=1");
      expect(currentAppPath()).toBe("/build/9?a=1");
    });

    it("子路径部署：去掉部署前缀", () => {
      process.env.PUBLIC_PATH = "/bi";
      setLocation("/bi/build/9", "?a=1");
      expect(currentAppPath()).toBe("/build/9?a=1");
    });
  });

  it("clearSession 清掉令牌与用户缓存，保留其他本地数据", () => {
    window.localStorage.setItem("bi_token", "t");
    window.localStorage.setItem("userInfo", "{}");
    window.localStorage.setItem("routeData", "[]");
    window.localStorage.setItem("versionCodeList", "[]");

    clearSession();

    expect(window.localStorage.getItem("bi_token")).toBeNull();
    expect(window.localStorage.getItem("userInfo")).toBeNull();
    expect(window.localStorage.getItem("routeData")).toBeNull();
    expect(window.localStorage.getItem("versionCodeList")).toBe("[]");
  });

  describe("redirectToLogin", () => {
    it("带上合法的回跳地址", () => {
      redirectToLogin("/build/3?x=1");
      expect(assign).toHaveBeenCalledWith("/login?redirect=" + encodeURIComponent("/build/3?x=1"));
    });

    it("回跳地址是主页或不合法时不带 redirect", () => {
      redirectToLogin("/display");
      redirectToLogin("//evil.com");
      expect(assign).toHaveBeenNthCalledWith(1, "/login");
      expect(assign).toHaveBeenNthCalledWith(2, "/login");
    });
  });

  describe("handleUnauthorized", () => {
    it("在公开页（登录页 / 分享预览）不动，不清令牌也不跳转", () => {
      window.localStorage.setItem("bi_token", "t");
      setLocation("/view/12");
      handleUnauthorized();
      expect(assign).not.toHaveBeenCalled();
      expect(window.localStorage.getItem("bi_token")).toBe("t");
    });

    it("在受保护页清登录态并跳登录页（只触发一次）", () => {
      window.localStorage.setItem("bi_token", "t");
      setLocation("/build/7");
      handleUnauthorized();
      handleUnauthorized();
      expect(window.localStorage.getItem("bi_token")).toBeNull();
      expect(assign).toHaveBeenCalledTimes(1);
      expect(assign).toHaveBeenCalledWith("/login?redirect=" + encodeURIComponent("/build/7"));
    });
  });
});
