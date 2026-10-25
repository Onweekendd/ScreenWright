import { constants } from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { ResourceTypeEnum } from "@screenwright/types";

import { assetStore } from "@/lib/storage";

import { addWorkspaceAsset } from "./ai-asset-library";
import { getScreenDirPath, getWorkspaceBase } from "../screen/screen-workspace";

/**
 * 每个大屏自己的本地素材区：`screen_{id}_{ver}/assets/`，放「拉下来 / 待上传」的图片和视频。
 *
 * 放在大屏目录里，素材就跟着大屏走、互不串；同时它是沙箱（execute_command）工作目录的子目录，
 * agent 能直接在这里本地处理文件。版本历史（git 快照）把 `assets/` 排除在外——二进制素材进快照会撑大历史，
 * 回退用的 `git reset --hard` 也不会动被忽略的文件，见 version-history 的 BASE_IGNORE_PATTERNS。
 */
export const ASSETS_DIR = "assets";

/** 单个文件的大小上限：整个文件进内存，再大就该用别的办法 */
export const MAX_ASSET_BYTES = 50 * 1024 * 1024;

/** 同名但内容不同的文件，加 -1、-2… 后缀避让，最多试这么多次 */
const MAX_NAME_ATTEMPTS = 99;

const SCREEN_KEY_PATTERN = /^(?:screen_)?(\d+_\d+)$/;

/** 工具入参的大屏 id（"9_1"，带不带 screen_ 前缀都行）→ 工作区目录用的 key（"9_1"） */
export function screenKeyOf(screenId: string): string {
  const match = SCREEN_KEY_PATTERN.exec(screenId.trim());
  if (!match) {
    throw new Error(`screenId 格式不对（${screenId}），应为 "{screenId}_{versionCode}"，如 "29445_1"`);
  }
  return match[1];
}

const workspaceRoot = () => path.resolve(getWorkspaceBase());
const screenRoot = (screenKey: string) => path.resolve(getScreenDirPath(screenKey));
const assetsRootOf = (screenKey: string) => path.join(screenRoot(screenKey), ASSETS_DIR);
/** 给报错用的目录写法 */
const assetsLabelOf = (screenKey: string) => `screen_${screenKey}/${ASSETS_DIR}/`;

/** 工作区相对路径，正斜杠（和其他工具的路径写法一致） */
const toWorkspacePath = (absolute: string) => path.relative(workspaceRoot(), absolute).split(path.sep).join("/");

const isInside = (root: string, target: string) => {
  const relative = path.relative(root, target);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
};

/**
 * 大屏的工作区目录必须已经存在：它由大屏数据同步建出来。
 * 这里不替它建——只为放素材凭空建出一个没有 info.json 的 screen_ 目录，会被同步当成一个残缺的大屏。
 */
async function ensureScreenExists(screenKey: string): Promise<void> {
  const stat = await fsp.stat(screenRoot(screenKey)).catch(() => null);
  if (!stat?.isDirectory()) {
    throw new Error(`大屏工作区不存在：screen_${screenKey}（screenId 是不是写错了？）`);
  }
}

/** 文件名：去掉路径分隔和系统不允许的字符，别以点开头，限长 */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  // 控制字符（码位 < 32）也不允许；用码位判断而不是正则，避免 no-control-regex
  const cleaned = [...base]
    .map((char) => (char.charCodeAt(0) < 32 || ':*?"<>|'.includes(char) ? "_" : char))
    .join("")
    .replace(/^\.+/, "")
    .trim();
  return cleaned.slice(0, 120) || "asset";
}

/** assets 下的子目录：只允许相对路径、不许跳出 assets */
function resolveAssetsDir(screenKey: string, dir: string | undefined): string {
  const root = assetsRootOf(screenKey);
  if (!dir?.trim()) {
    return root;
  }
  const target = path.resolve(root, dir.trim().replace(/^(?:screen_\d+_\d+[\\/])?assets[\\/]?/, ""));
  if (target !== root && !isInside(root, target)) {
    throw new Error(`目录只能在 ${assetsLabelOf(screenKey)} 里面：${dir}`);
  }
  return target;
}

/** 入参可以是素材 url，也可以是对象存储的 key；都解析不出就是不属于本系统的存储 */
function resolveKey(source: string): string {
  const text = source.trim();
  const key =
    assetStore().keyFromUrl(text) ?? (/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? null : text.replace(/^\/+/, ""));
  if (!key || key.split("/").includes("..")) {
    throw new Error(`不是本系统存储里的文件：${source}（只能拉自己系统里的 url 或存储 key）`);
  }
  return key;
}

/** 以 wx 写入；同名且内容一样就复用，内容不同就换名字，返回最终写到哪 */
async function writeUnique(
  dir: string,
  fileName: string,
  bytes: Buffer
): Promise<{ absolute: string; reused: boolean }> {
  const { name, ext } = path.parse(fileName);
  for (let attempt = 0; attempt <= MAX_NAME_ATTEMPTS; attempt++) {
    const absolute = path.join(dir, attempt === 0 ? fileName : `${name}-${attempt}${ext}`);
    try {
      await fsp.writeFile(absolute, bytes, { flag: constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL });
      return { absolute, reused: false };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error;
      }
      const existing = await fsp.readFile(absolute);
      if (existing.equals(bytes)) {
        return { absolute, reused: true };
      }
    }
  }
  throw new Error(`同名文件太多，没法给 ${fileName} 找到空位`);
}

export interface PullSource {
  /** 素材 url（工具返回的、素材库里的），或对象存储的 key */
  url: string;
  /** 落到工作区的文件名；不传取原文件名 */
  name?: string;
}

export interface PulledAsset {
  /** 文件在工作区里的最终位置（相对工作区根，正斜杠） */
  path: string;
  absolutePath: string;
  size: number;
  /** 工作区里已经有内容一样的同名文件，没有重复写 */
  reused: boolean;
}

/** 从对象存储（minio / 本地存储）拉一个文件到这个大屏的 assets 目录 */
export async function pullAsset(source: PullSource, screenId: string, dir?: string): Promise<PulledAsset> {
  const screenKey = screenKeyOf(screenId);
  await ensureScreenExists(screenKey);
  const key = resolveKey(source.url);
  const store = assetStore();
  const head = await store.head(key);
  if (!head) {
    throw new Error(`存储里没有这个文件：${source.url}（url 要原样复制，别手敲）`);
  }
  if (head.size > MAX_ASSET_BYTES) {
    throw new Error(
      `文件太大（${Math.round(head.size / 1024 / 1024)}MB，上限 ${MAX_ASSET_BYTES / 1024 / 1024}MB）：${source.url}`
    );
  }
  const bytes = await store.get(key);
  const target = resolveAssetsDir(screenKey, dir);
  await fsp.mkdir(target, { recursive: true });
  const written = await writeUnique(target, safeFileName(source.name ?? path.posix.basename(key)), bytes);
  return {
    path: toWorkspacePath(written.absolute),
    absolutePath: written.absolute,
    size: bytes.length,
    reused: written.reused
  };
}

const FILE_TYPES: Record<
  string,
  { resourceType: ResourceTypeEnum.image | ResourceTypeEnum.video; contentType: string }
> = {
  ".png": { resourceType: ResourceTypeEnum.image, contentType: "image/png" },
  ".jpg": { resourceType: ResourceTypeEnum.image, contentType: "image/jpeg" },
  ".jpeg": { resourceType: ResourceTypeEnum.image, contentType: "image/jpeg" },
  ".webp": { resourceType: ResourceTypeEnum.image, contentType: "image/webp" },
  ".gif": { resourceType: ResourceTypeEnum.image, contentType: "image/gif" },
  ".svg": { resourceType: ResourceTypeEnum.image, contentType: "image/svg+xml" },
  ".mp4": { resourceType: ResourceTypeEnum.video, contentType: "video/mp4" },
  ".webm": { resourceType: ResourceTypeEnum.video, contentType: "video/webm" },
  ".mov": { resourceType: ResourceTypeEnum.video, contentType: "video/quicktime" }
};

export interface PushSource {
  /**
   * 这个大屏 assets 目录下的文件：写 pullAssetsTool 返回的 path（如 "screen_9_1/assets/card.png"），
   * 或者只写 assets 里的相对路径（如 "card.png"）都行
   */
  path: string;
  /** 素材库里显示的名字；不传取文件名 */
  name?: string;
}

export interface PushedAsset {
  /** 在素材库里的素材 id */
  libraryFileId: number;
  /** 文件在对象存储里的最终位置 */
  url: string;
  size: number;
  /** 素材库里已经有这个文件（同一个用户、同样内容），没有新建 */
  reused: boolean;
}

/** 相对路径怎么解析：以 screen_ 开头的是工作区相对路径，否则当作 assets 目录里的相对路径 */
const absoluteOf = (filePath: string, screenKey: string): string => {
  if (path.isAbsolute(filePath)) {
    return path.resolve(filePath);
  }
  const normalized = filePath.replace(/\\/g, "/");
  return normalized.startsWith("screen_")
    ? path.resolve(workspaceRoot(), normalized)
    : path.resolve(assetsRootOf(screenKey), normalized);
};

/** 解析并校验要上传的文件：必须在这个大屏的 assets 目录里（含符号链接指向的真实位置）、是文件、不超限、类型可上传 */
async function readUploadable(filePath: string, screenKey: string) {
  const root = assetsRootOf(screenKey);
  const absolute = absoluteOf(filePath, screenKey);
  const outside = new Error(`只能上传 ${assetsLabelOf(screenKey)} 目录里的文件：${filePath}`);
  if (!isInside(root, absolute)) {
    throw outside;
  }
  let real: string;
  try {
    real = await fsp.realpath(absolute);
  } catch {
    throw new Error(`文件不存在：${filePath}`);
  }
  // 符号链接可能指到 assets 之外（比如指向组件文件或系统文件），按真实位置再校验一遍
  if (!isInside(await fsp.realpath(root), real)) {
    throw outside;
  }
  const stat = await fsp.stat(real);
  if (!stat.isFile()) {
    throw new Error(`不是文件：${filePath}`);
  }
  if (stat.size > MAX_ASSET_BYTES) {
    throw new Error(
      `文件太大（${Math.round(stat.size / 1024 / 1024)}MB，上限 ${MAX_ASSET_BYTES / 1024 / 1024}MB）：${filePath}`
    );
  }
  const extension = path.extname(real).toLowerCase();
  const type = FILE_TYPES[extension];
  if (!type) {
    throw new Error(`素材库只收图片和视频（${Object.keys(FILE_TYPES).join(" ")}）：${filePath}`);
  }
  return { absolute, real, extension, type };
}

/** 把这个大屏 assets 目录里的一个文件传到对象存储，并放进大屏所有者的素材库 */
export async function pushAsset(source: PushSource, screenId: string, largeId: number): Promise<PushedAsset> {
  const { absolute, real, extension, type } = await readUploadable(source.path, screenKeyOf(screenId));
  const bytes = await fsp.readFile(real);
  const name = source.name?.trim() || path.parse(absolute).name;
  const saved = await addWorkspaceAsset({
    largeId,
    name,
    bytes,
    extension,
    contentType: type.contentType,
    resourceType: type.resourceType
  });
  return { libraryFileId: saved.id, url: saved.url, size: saved.size, reused: saved.reused };
}
