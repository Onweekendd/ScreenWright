import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import JSZip from "jszip";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const { version } = JSON.parse(readFileSync(resolve(root, "package.json"), "utf-8"));

const manifest = JSON.parse(readFileSync(resolve(root, "manifest.json"), "utf-8"));
manifest.name = `Screenwright 规范助手 V${version}`;

const zip = new JSZip();
zip.file("manifest.json", JSON.stringify(manifest, null, 2));
zip.file("dist/code.js", readFileSync(resolve(root, "dist/code.js")));
zip.file("dist/index.html", readFileSync(resolve(root, "dist/index.html")));
zip.file("figma-helper.crt", readFileSync(resolve(root, "figma-helper.crt")));
zip.file("证书安装说明.md", readFileSync(resolve(root, "证书安装说明.md")));
zip.file("使用文档.md", readFileSync(resolve(root, "使用文档.md")));

mkdirSync(resolve(root, "releases"), { recursive: true });

const outputName = `Screenwright 规范助手 V${version}.zip`;
const outputPath = resolve(root, "releases", outputName);
const content = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
writeFileSync(outputPath, content);

console.log(`✓ 打包完成: releases/${outputName}`);
