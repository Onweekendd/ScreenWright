import { createHash } from "node:crypto";

import type { Blueprint, BlueprintAsset, BlueprintInput, BlueprintNode, Region } from "./schema";

/** 越界 / 超出父节点在这个像素数以内不算问题：模型读坐标有误差，卡片的发光描边也常溢出一两像素 */
const EDGE_TOLERANCE = 4;
/**
 * 生图的宽高比上限。服务商只支持几档常见比例（最宽 21:9 上下），更扁的条状素材生成后
 * 被 objectFit 拉伸到目标比例会严重变形——这类素材该改成裁切或用组件画。
 */
export const MAX_GENERATE_ASPECT = 4;
/** 效果图与画布宽高比相差超过这个比例时提醒：裁切按两个方向分别缩放，比例不同会把素材压扁 */
const ASPECT_MISMATCH = 0.02;

export interface CheckResult {
  errors: string[];
  warnings: string[];
  /** 没有 error 时才有 */
  blueprint?: Blueprint;
}

const area = (r: Region) => r.width * r.height;

const roundRegion = (r: Region): Region => ({
  x: Math.round(r.x),
  y: Math.round(r.y),
  width: Math.max(1, Math.round(r.width)),
  height: Math.max(1, Math.round(r.height))
});

/** a 超出 b 的最大像素数（四条边取最大），完全在内为 0 或负 */
const overflow = (a: Region, b: Region): number =>
  Math.max(b.x - a.x, b.y - a.y, a.x + a.width - (b.x + b.width), a.y + a.height - (b.y + b.height));

const intersects = (a: Region, b: Region): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

const describe = (r: Region) => `(${r.x}, ${r.y}, ${r.width}×${r.height})`;

/** 实际发给生图服务的提示词：统一风格在前、素材本身在后 */
export const effectivePrompt = (style: string | undefined, prompt: string): string =>
  style?.trim() ? `${style.trim()}。${prompt.trim()}` : prompt.trim();

const promptLimit = (): number | undefined => Number(process.env.IMAGE_PROMPT_MAX_CHARS) || undefined;

/**
 * 素材的输入指纹。重新保存蓝图时，规格没变的素材沿用上次准备好的结果，
 * 改了提示词 / 裁切区域 / 尺寸的才回到 pending——不然改一个节点名就要把整批素材重来一遍。
 */
const fingerprintOf = (asset: BlueprintAsset, input: BlueprintInput): string => {
  const basis = {
    source: asset.source,
    prompt: asset.source === "generate" ? effectivePrompt(input.style, asset.prompt ?? "") : undefined,
    crop: asset.source === "crop" ? [asset.cropRegion, input.sourceImage?.url] : undefined,
    url: asset.source === "reuse" ? asset.url : undefined,
    target: asset.target
  };
  return createHash("sha256").update(JSON.stringify(basis)).digest("hex").slice(0, 16);
};

/**
 * 校验并补全一份蓝图：
 * - 结构：key 唯一、父节点存在、没有环、asset 节点引用的素材存在；
 * - 位置：不越出画布、子节点不越出父节点（后者只提醒）；
 * - 素材：按来源检查必填项，推导目标尺寸与使用方，沿用上次规格相同的准备结果；
 * - 层级：同级按 z → 面积大的在下 → 书写顺序排好，z 补成名次。
 */
export function checkBlueprint(input: BlueprintInput, previous?: Blueprint): CheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const canvas: Region = { x: 0, y: 0, width: input.canvas.width, height: input.canvas.height };

  const nodes = input.nodes.map((node) => ({ ...node, region: roundRegion(node.region) }));
  const byKey = new Map<string, BlueprintNode>();
  for (const node of nodes) {
    if (byKey.has(node.key)) {
      errors.push(`节点 key 重复：${node.key}`);
    }
    byKey.set(node.key, node);
  }

  const specs = new Map(input.assets.map((asset) => [asset.key, asset]));
  if (specs.size !== input.assets.length) {
    const seen = new Set<string>();
    for (const asset of input.assets) {
      if (seen.has(asset.key)) {
        errors.push(`素材 key 重复：${asset.key}`);
      }
      seen.add(asset.key);
    }
  }

  const usedBy = new Map<string, BlueprintNode[]>();
  for (const node of nodes) {
    const label = `节点 ${node.key}`;
    if (node.parent !== undefined && !byKey.has(node.parent)) {
      errors.push(`${label} 的父节点 ${node.parent} 不存在`);
    }
    if (node.parent === node.key) {
      errors.push(`${label} 的父节点是它自己`);
    }

    if (!intersects(node.region, canvas)) {
      errors.push(`${label} 的位置 ${describe(node.region)} 完全在画布 ${canvas.width}×${canvas.height} 之外`);
    } else if (overflow(node.region, canvas) > EDGE_TOLERANCE) {
      warnings.push(`${label} 的位置 ${describe(node.region)} 超出画布 ${overflow(node.region, canvas)} 像素`);
    }
    const parent = node.parent ? byKey.get(node.parent) : undefined;
    if (parent) {
      const over = overflow(node.region, roundRegion(parent.region));
      if (over > EDGE_TOLERANCE) {
        warnings.push(`${label} 超出父节点 ${parent.key} 的范围 ${over} 像素，确认是否挂错了父节点`);
      }
    }

    if (node.kind === "asset") {
      if (!node.asset) {
        errors.push(`${label} 是 asset 节点，但没有填 asset（素材 key）`);
      } else if (!specs.has(node.asset)) {
        errors.push(`${label} 引用的素材 ${node.asset} 不在素材清单里`);
      } else {
        usedBy.set(node.asset, [...(usedBy.get(node.asset) ?? []), node]);
      }
    } else if (node.asset) {
      errors.push(`${label} 是 ${node.kind} 节点，只有 kind=asset 的节点能引用素材；要贴图就加一个 asset 子节点`);
    }
    if (node.kind === "component" && !node.component) {
      warnings.push(`${label} 没写组件类型（component），组装时要再看一遍效果图才能决定`);
    }
  }

  const ordered = orderNodes(nodes, errors);

  const limit = promptLimit();
  const sourceAspectOff =
    input.sourceImage &&
    Math.abs(input.sourceImage.width / input.sourceImage.height / (canvas.width / canvas.height) - 1) > ASPECT_MISMATCH;
  if (sourceAspectOff) {
    warnings.push(
      `效果图 ${input.sourceImage!.width}×${input.sourceImage!.height} 与画布 ${canvas.width}×${canvas.height} 的宽高比不同，裁切出的素材会变形`
    );
  }

  const assets: BlueprintAsset[] = [];
  for (const spec of input.assets) {
    const label = `素材 ${spec.key}`;
    const users = usedBy.get(spec.key) ?? [];
    if (users.length === 0) {
      errors.push(`${label} 没有任何节点使用：删掉它，或加一个 kind=asset、asset=${spec.key} 的节点`);
      continue;
    }
    const largest = users.reduce((a, b) => (area(b.region) > area(a.region) ? b : a));
    const cropRegion = spec.source === "crop" ? roundRegion(spec.cropRegion ?? users[0].region) : undefined;
    const target = cropRegion
      ? { width: cropRegion.width, height: cropRegion.height }
      : { width: largest.region.width, height: largest.region.height };

    if (spec.source === "generate") {
      if (!spec.prompt?.trim()) {
        errors.push(`${label} 是生图素材，但没有 prompt`);
      } else if (limit && effectivePrompt(input.style, spec.prompt).length > limit) {
        errors.push(
          `${label} 的提示词连同统一风格共 ${effectivePrompt(input.style, spec.prompt).length} 字，超过生图服务上限 ${limit} 字`
        );
      }
      const aspect = Math.max(target.width / target.height, target.height / target.width);
      if (aspect > MAX_GENERATE_ASPECT) {
        warnings.push(
          `${label} 的宽高比 ${aspect.toFixed(1)}:1 太极端，生图服务出不了这么扁/窄的图，拉伸后会变形；建议改成 crop，或用组件画`
        );
      }
    }
    if (spec.source === "crop") {
      if (!input.sourceImage) {
        errors.push(`${label} 要从效果图裁切，但蓝图没填 sourceImage`);
      }
      if (cropRegion && !intersects(cropRegion, canvas)) {
        errors.push(`${label} 的裁切区域 ${describe(cropRegion)} 完全在画布之外`);
      }
    }
    if (spec.source === "reuse" && !spec.url) {
      errors.push(`${label} 是复用素材，但没有 url`);
    }

    const asset: BlueprintAsset = {
      ...spec,
      ...(cropRegion ? { cropRegion } : {}),
      usedBy: users.map((user) => user.key),
      target,
      status: "pending"
    };
    asset.fingerprint = fingerprintOf(asset, input);
    const before = previous?.assets.find((old) => old.key === spec.key);
    if (before && before.fingerprint === asset.fingerprint && before.status === "ready") {
      Object.assign(asset, {
        status: before.status,
        resultUrl: before.resultUrl,
        resultSize: before.resultSize,
        imageId: before.imageId
      });
    }
    assets.push(asset);
  }

  if (errors.length > 0) {
    return { errors, warnings };
  }
  return { errors, warnings, blueprint: { ...input, nodes: ordered, assets } };
}

/**
 * 按「父在前、同级从下到上」排出组装顺序，并把 z 补成同级内的名次（0 在最下）。
 * 同级排序：显式 z 小的在下 → 面积大的在下（背景、底板先铺）→ 书写顺序。
 * 从根出发走不到的节点就是成环了。
 */
function orderNodes(nodes: BlueprintNode[], errors: string[]): Array<BlueprintNode & { z: number }> {
  const index = new Map(nodes.map((node, i) => [node.key, i]));
  const children = new Map<string | undefined, BlueprintNode[]>();
  for (const node of nodes) {
    const parent = node.parent !== undefined && index.has(node.parent) ? node.parent : undefined;
    children.set(parent, [...(children.get(parent) ?? []), node]);
  }

  const ordered: Array<BlueprintNode & { z: number }> = [];
  // key 重复时同一个 key 会出现在多个位置，不记着走过的会在重复节点之间来回递归
  const visited = new Set<string>();
  const visit = (parent: string | undefined) => {
    if (parent !== undefined) {
      if (visited.has(parent)) {
        return;
      }
      visited.add(parent);
    }
    const siblings = [...(children.get(parent) ?? [])].sort(
      (a, b) => (a.z ?? 0) - (b.z ?? 0) || area(b.region) - area(a.region) || index.get(a.key)! - index.get(b.key)!
    );
    siblings.forEach((node, rank) => {
      ordered.push({ ...node, z: rank });
      visit(node.key);
    });
  };
  visit(undefined);

  if (ordered.length < nodes.length) {
    const reached = new Set(ordered.map((node) => node.key));
    const lost = nodes.filter((node) => !reached.has(node.key)).map((node) => node.key);
    errors.push(`父子关系成环，这些节点挂不到大屏根上：${lost.join("、")}`);
  }
  return ordered;
}
