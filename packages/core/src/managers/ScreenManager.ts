import type { LargeScreeInfo, LargeScreenDetailInfo, ParsedLargeScreenInfo } from "@screenwright/types";

import { createDefaultDetail, createDefaultNavInfo } from "../state/createInitialState";
import type { EditorCoreState, NavInfo } from "../types/state";
import { parseIfNeeded } from "../utils/parseIfNeeded";
import { BaseManager } from "./BaseManager";

/** setNavInfo 时需要从原始数据剔除/单独解析的字段。 */
const NAV_OMIT_KEYS = ["layers", "detail", "config", "encodedControl", "dataFilterArr", "aniFrameSet"] as const;

/** 轻量 omit，避免 core 依赖 lodash。 */
function omitKeys<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * 大屏元信息里**归本管理器管**的那部分。
 *
 * navInfo 上还挂着 dataFilterArr / aniFrameSet / statusAnimation 三项，它们各有自己的管理器
 * （dataFilter、动画），也各自独立落盘，不随这份元信息一起流转，故从这个类型里排除。
 */
export type ScreenMetaInfo = Omit<NavInfo, "dataFilterArr" | "aniFrameSet" | "statusAnimation">;

/**
 * 大屏管理：负责大屏元信息（navInfo）的解析、读取与更新。
 * 纯逻辑，框架无关；副作用（如错误提示）留给适配层处理。
 */
export class ScreenManager extends BaseManager<EditorCoreState> {
  /** 获取当前大屏元信息。 */
  getNavInfo(): NavInfo {
    return this.getState().navInfo;
  }

  /**
   * 用后端返回的原始大屏数据填充 navInfo：
   * 把 config / encodedControl / dataFilterArr / aniFrameSet / statusAnimation
   * 这些可能为 JSON 字符串的字段解析成对象/数组。
   */
  setNavInfo(detailInfo: LargeScreeInfo): void {
    const parsedDetail = parseIfNeeded<LargeScreenDetailInfo>(detailInfo.detail, createDefaultDetail());
    if (!parsedDetail.minioIds) {
      parsedDetail.minioIds = [];
    }

    const navInfo: NavInfo = {
      ...omitKeys(detailInfo, NAV_OMIT_KEYS),
      config: parseIfNeeded<ParsedLargeScreenInfo["config"]>(detailInfo.config, []),
      encodedControl: parseIfNeeded<ParsedLargeScreenInfo["encodedControl"]>(detailInfo.encodedControl, []),
      dataFilterArr: parseIfNeeded<ParsedLargeScreenInfo["dataFilterArr"]>(detailInfo.dataFilterArr, {}),
      aniFrameSet: parseIfNeeded<ParsedLargeScreenInfo["aniFrameSet"]>(detailInfo.aniFrameSet, {
        animationList: [],
        activeAnimationList: []
      }),
      statusAnimation: parseIfNeeded<ParsedLargeScreenInfo["statusAnimation"]>(detailInfo.statusAnimation, {
        animations: {},
        statusAnimations: {},
        componentAnimations: {}
      }),
      // detail 的 scale 字段不跟随后端下发覆盖，沿用当前值（对应原 app 侧 setDetail2Config 的行为）
      detail: { ...parsedDetail, scale: this.getState().navInfo.detail.scale }
    };
    this.setState({ navInfo });
  }

  /**
   * 断言大屏元信息就是这一份（约定②）：**整份替换**，不与旧值合并。
   *
   * 传进来时少掉的字段就是要删掉。这一点跟 {@link setDetailField} 那种改单个字段的写法不同，
   * 也正是它存在的理由：合并语义下调用方删掉一个字段会被旧值静默补回来，落盘后新旧并存，
   * 改的人看不出自己白改了。
   *
   * dataFilterArr / aniFrameSet / statusAnimation 不在 {@link ScreenMetaInfo} 里，原样保留。
   *
   * 与 {@link setNavInfo} 的分工：那个吃后端接口下发的**原始形态**（字段可能是 JSON 字符串，
   * 要解析、要补默认值、scale 要沿用当前值）；这个吃的是已经是内存形态的一份，只做替换。
   */
  replaceNavInfo(info: ScreenMetaInfo): void {
    const { dataFilterArr, aniFrameSet, statusAnimation } = this.getState().navInfo;
    this.setState({ navInfo: { ...info, dataFilterArr, aniFrameSet, statusAnimation } });
  }

  /** 获取当前大屏详细配置（尺寸/适配/终端通信等）。 */
  getDetail(): LargeScreenDetailInfo {
    return this.getState().navInfo.detail;
  }

  /** 设置详细配置里的单个字段（就地修改当前 navInfo.detail）。 */
  setDetailField<K extends keyof LargeScreenDetailInfo>(key: K, value: LargeScreenDetailInfo[K]): void {
    const navInfo = this.getState().navInfo;
    navInfo.detail[key] = value;
    this.setState({ navInfo });
  }

  /** 重置详细配置为默认值（保留当前 scale，对应原 app 侧 resetEditStore 的行为）。 */
  resetDetail(): void {
    const navInfo = this.getState().navInfo;
    const scale = navInfo.detail.scale;
    navInfo.detail = { ...createDefaultDetail(), scale };
    this.setState({ navInfo });
  }

  /** 更新版本号（就地修改当前 navInfo）。 */
  setVersionCode(code: string): void {
    const navInfo = this.getState().navInfo;
    navInfo.versionCode = code;
    this.setState({ navInfo });
  }

  /** 重置为默认大屏元信息。 */
  resetNavInfo(): void {
    this.setState({ navInfo: createDefaultNavInfo() });
  }

  /** 是否多人协作大屏（type === 2）。 */
  isMultiPerson(): boolean {
    return this.getState().navInfo.type === 2;
  }
}
