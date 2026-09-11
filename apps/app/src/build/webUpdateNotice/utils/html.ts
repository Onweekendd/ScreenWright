import { FUNBI_SCRIPT_TAG_ID } from "./constant";

/**
 * 向 HTML 注入指定的标签（仅接口占位）
 */
export function injectTags(
  html: string,
  {
    version,
    injectFileBase,
    directoryName,
    injectStyleFileName,
    injectScriptFileName
  }: {
    version: string;
    injectFileBase: string;
    directoryName: string;
    injectStyleFileName: string;
    injectScriptFileName: string;
  },
  { cssFileHash, jsFileHash }: { jsFileHash: string; cssFileHash: string }
): string {
  const cssLinkHtml = `<link rel="stylesheet" href="${injectFileBase}${directoryName}/${injectStyleFileName}.${cssFileHash}.css">`;
  let res = html;

  res = res.replace(
    "<head>",
    `<head>
    ${cssLinkHtml}
    <script data-id="${FUNBI_SCRIPT_TAG_ID}" data-version="${version}" src="${injectFileBase}${directoryName}/${injectScriptFileName}.${jsFileHash}.js"></script>`
  );

  return res;
}
