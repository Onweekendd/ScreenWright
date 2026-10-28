import { ScreenEditor } from "@screenwright/core";

import { getScreenVersionKeyFromPath } from "../screen/screen-workspace";
import { writeScreen } from "./screen-mutation";
import { ScreenReader } from "./screen-read";

/** 一块大屏在内存里的整屏树：reader 即状态，editor 是在它上面跑 core 规则的入口。 */
export interface ScreenTree {
  screenKey: string;
  reader: ScreenReader;
  editor: ScreenEditor;
}

/**
 * 一次编辑会碰到大屏的哪一块，用来判断两次编辑能不能叠在同一棵树上：
 * - `component`：改这个组件自己（分组包围盒的重算顺带）；
 * - `screenInfo`：替换屏级元信息；
 * - `screen`：影响面说不清——过滤器保存会顺手改各组件上的绑定。
 */
export type TreeClaim = { componentId: number } | "screenInfo" | "screen";

interface TreeEntry extends ScreenTree {
  componentIds: Set<number>;
  screenInfo: boolean;
  screen: boolean;
  dirty: boolean;
}

/**
 * 一批编辑共用的整屏树，按大屏分开、每块屏只读一次，{@link flush} 时每块屏只写一次。
 *
 * 原来每个文件都要「整屏读 → 改 → 整屏写」一轮，文件一多光同步 IO 就是 N 倍。合到一棵树上之后，
 * 前提是这批编辑**互不覆盖**：编辑的输入是 agent 改过的磁盘文本，它只认得盘上的旧状态。比如先改了分组
 * 的成员、再改分组本身，分组那份 json 内联时子树是从盘上读的，replace 下去就把刚才的成员改动冲掉了。
 * 所以每次编辑上树前先 {@link claim}：跟已经上树的编辑有交集就拒绝，由调用方先把前面的落了盘再来。
 */
export class ScreenTreeSet {
  private readonly trees = new Map<string, TreeEntry>();

  /**
   * 取被编辑文件所在大屏的树，这批里第一次碰到这块屏才整屏读。
   * @param info 用这份元信息建树而不是读盘上的 info.json（编辑的就是它，旧版可能本身不合 schema）
   * @returns null 表示路径不在任何大屏目录下
   * @throws 整屏读取失败（缺文件、schema 不过）时抛
   */
  open(absPath: string, info?: ConstructorParameters<typeof ScreenReader>[0]["info"]): ScreenTree | null {
    const screenKey = getScreenVersionKeyFromPath(absPath);
    if (!screenKey) {
      return null;
    }
    let entry = this.trees.get(screenKey);
    if (!entry) {
      const reader = new ScreenReader({ id: screenKey, info });
      entry = {
        screenKey,
        reader,
        editor: ScreenEditor.create(reader),
        componentIds: new Set(),
        screenInfo: false,
        screen: false,
        dirty: false
      };
      this.trees.set(screenKey, entry);
    }
    return entry;
  }

  /**
   * 登记一次即将上树的编辑；跟这块屏上已登记的编辑有交集时返回 false，什么都不登记。
   *
   * 组件之间的交集是「同一个、或一方是另一方的祖先」：成员改了位置，分组的包围盒跟着变，
   * 分组那份 json 再 replace 下来会把成员冲回盘上的旧版。兄弟之间互不影响，可以叠。
   */
  claim(tree: ScreenTree, claim: TreeClaim): boolean {
    const entry = this.entryOf(tree);
    if (entry.screen) {
      return false;
    }
    if (claim === "screen") {
      if (entry.componentIds.size > 0 || entry.screenInfo) {
        return false;
      }
      entry.screen = true;
      return true;
    }
    if (claim === "screenInfo") {
      if (entry.screenInfo) {
        return false;
      }
      entry.screenInfo = true;
      return true;
    }

    const lineage = this.lineageOf(entry, claim.componentId);
    for (const claimed of entry.componentIds) {
      if (lineage.has(claimed) || this.lineageOf(entry, claimed).has(claim.componentId)) {
        return false;
      }
    }
    entry.componentIds.add(claim.componentId);
    return true;
  }

  /** 标记这块屏的树被改过，{@link flush} 时要写回。 */
  markDirty(tree: ScreenTree): void {
    this.entryOf(tree).dirty = true;
  }

  /** 改过的每块屏整屏写回一次。 */
  flush(): void {
    for (const entry of this.trees.values()) {
      if (entry.dirty) {
        writeScreen(entry.screenKey, entry.reader);
        entry.dirty = false;
      }
    }
  }

  private entryOf(tree: ScreenTree): TreeEntry {
    const entry = this.trees.get(tree.screenKey);
    if (entry !== tree) {
      throw new Error(`大屏 ${tree.screenKey} 的树不属于这个 ScreenTreeSet`);
    }
    return entry;
  }

  /** 组件自己加上它的全部祖先 id */
  private lineageOf(tree: ScreenTree, componentId: number): Set<number> {
    const lineage = new Set<number>([componentId]);
    let parentId = tree.editor.component.find(componentId)?.parent;
    while (parentId !== undefined && parentId !== null && !lineage.has(Number(parentId))) {
      lineage.add(Number(parentId));
      parentId = tree.editor.component.find(parentId)?.parent;
    }
    return lineage;
  }
}
