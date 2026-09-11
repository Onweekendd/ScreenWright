// Types
export type { ExtractorFn, GlobalVars, StyleTypes, TraversalContext, TraversalOptions } from "./types";

// Core traversal function
export { extractFromDesign } from "./node-walker";

// Design-level extraction (unified nodes + components)
export { simplifyRawFigmaObject } from "./design-extractor";

// Built-in extractors and afterChildren helpers
export {
  // Convenience combinations
  allExtractors,
  // afterChildren helpers
  collapseSvgContainers,
  componentExtractor,
  contentOnly,
  layoutAndText,
  layoutExtractor,
  layoutOnly,
  SVG_ELIGIBLE_TYPES,
  textExtractor,
  visualsExtractor,
  visualsOnly
} from "./built-in";
