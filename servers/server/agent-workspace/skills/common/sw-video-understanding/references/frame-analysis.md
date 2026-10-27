# 抽帧拼图与时间依据

以下是命令模板，不是固定路径。先创建任务自己的输出目录，替换文件名；根据运行环境正确引用路径和 URL。不要把 signed URL 的 `&` 裸放进 shell。下载应设置超时、检查 HTTP 状态并保留原视频，避免把错误 HTML 当成 mp4。

## 探测

```sh
ffprobe -v error -show_format -show_streams -of json "source.mp4"
```

关注 `duration`、`width/height`、`avg_frame_rate/r_frame_rate`、旋转侧数据和音频流。二者帧率相等也不能单独证明恒定帧率；不要把分数字符串当成浮点数直接计算。源视频呈现时间戳（PTS）优先于按帧率估算。

## 每 10 帧抽一张

```sh
ffmpeg -nostdin -hide_banner -i "source.mp4" -an -vf "select=not(mod(n\,10)),showinfo,scale=480:-2" -fps_mode vfr "frames/frame-%06d.png"
```

目录 `frames/` 必须预先存在。`n` 从 0 开始，所以采样的是源解码帧 0、10、20……；输出文件通常从 1 编号，不能把输出序号直接当源帧号。8 或 12 帧间隔时替换 `10`。命令不改变采样前的帧率，`-fps_mode vfr` 避免补帧造成重复。

`showinfo` 放在 `select` 后，会输出每张采样帧的 `pts_time`。将 stderr 保存到任务日志，提取采样顺序和时间建立 manifest，例如：

```text
image,source_frame,source_time_seconds
frame-000001.png,0,0.000
frame-000002.png,10,0.333
```

示例时间只适用于对应素材。变帧率必须取实际 `pts_time`，不能照抄数值。源视频时间起点非零时记录并统一归一化约定；如果分窗口处理或使用 `-ss`，核对输出时间轴是否重置并显式加回窗口偏移。不要重复加偏移。

## 分页拼图

对已抽出的图片，可用 ffmpeg `tile` 或环境已有的图片处理库（例如 sharp）拼图。使用 manifest 驱动排序和标签，可避免按文件名字典顺序错排。

```sh
ffmpeg -nostdin -hide_banner -framerate 1 -i "frames/frame-%06d.png" -vf "scale=240:-2,tile=6x4:nb_frames=24:padding=4:margin=4" "sheets/sheet-%03d.png"
```

目录 `sheets/` 必须预先存在。这里 `-framerate 1` 只用于读取已抽好的图片，不代表源视频是 1 fps，也不能拿拼图输入时间作源时间。保留纵横比；最后一页可能有空格，应以实际图片数为准。检查页数和 manifest 覆盖范围，不能只读第一页就声称理解了整段。

此示例不绘制标签。实际分析时补充每格的源时间/帧号，或同时提供按“页号、行、列”索引的 manifest。需要绘字时先检查可用字体与滤镜，避免字体缺失导致整个抽帧流程失败。

## 局部精查

切镜边界、运动方向或接片有疑问时，只对相关短窗口增加采样密度。可先用 ffprobe 读取该窗口附近各帧的 `best_effort_timestamp_time`，再按实际时间选择原始帧。需要精确裁切时核查相邻帧；稀疏拼图只能将切点定位到采样间隔内。

运动分析保留至少首、中、尾帧及其源时间；小锚点使用更大单帧或同位置裁切比较，所有裁切必须使用一致坐标，不能分别重构图后比较。拼图没有运动矢量，也没有声音；它只提供时序视觉证据。
