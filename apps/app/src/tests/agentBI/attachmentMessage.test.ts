import { describe, expect, it } from "vitest";

import {
  buildVideoAttachmentXml,
  parseVideoAttachments
} from "@/views/build/components/agentBI/hooks/attachment/attachmentMessage";

describe("视频附件 XML", () => {
  it("转义名称和签名 URL，解析时恢复原值并保留正文", () => {
    const media = {
      filename: '雨 & "<夜>".mp4',
      mediaType: "video/mp4",
      url: "https://assets.example.com/a.mp4?x=1&y=2"
    };
    const xml = buildVideoAttachmentXml(media);
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&quot;");
    expect(xml).toContain("&lt;夜&gt;");
    expect(parseVideoAttachments(`请分析视频${xml}`)).toEqual({ text: "请分析视频", videos: [media] });
  });

  it("不把普通 URL 正文当作附件隐藏", () => {
    const text = "帮我看看 https://example.com/clip.mp4 的内容";
    expect(parseVideoAttachments(text)).toEqual({ text, videos: [] });
  });

  it("兼容旧的名称和 URL 格式，只移除附件文字", () => {
    expect(parseVideoAttachments("请看看视频\n\n视频素材：clip.mp4\nhttps://example.com/clip.mp4")).toEqual({
      text: "请看看视频",
      videos: [{ filename: "clip.mp4", mediaType: "video/mp4", url: "https://example.com/clip.mp4" }]
    });
  });
});
