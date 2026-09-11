# echartfunnel Schema 参考

## 组件类型
`echartfunnel`

## 关键配置字段

### 布局与朝向
| 字段 | 路径 | 类型 | 说明 |
|------|------|------|------|
| seriesOrient | option.seriesOrient | string | 漏斗图朝向（垂直/水平） |
| seriesSort | option.seriesSort | string | 漏斗图排序方式 |
| seriesFunnelAlign | option.seriesFunnelAlign | string | 水平对齐方式（左/中/右） |
| seriesGap | option.seriesGap | number | 漏斗层间距 |

### 文字阴影
| 字段 | 路径 | 类型 | 说明 |
|------|------|------|------|
| shadowColor | option.shadowColor | string | 阴影颜色 |
| shadowOffsetX | option.shadowOffsetX | number | 阴影X偏移 |
| shadowOffsetY | option.shadowOffsetY | number | 阴影Y偏移 |
| shadowBlur | option.shadowBlur | number | 阴影模糊半径 |

### 边框
| 字段 | 路径 | 类型 | 说明 |
|------|------|------|------|
| borderColor | option.borderColor | string | 边框颜色 |
| borderWidth | option.borderWidth | number | 边框宽度 |

### 标签与图例
| 组件 | 字段 | 说明 |
|------|------|------|
| ItemFunnelNumberLabel | label.* | 数值标签显示设置 |
| ItemConfigLegend | legend.* | 图例显示和样式 |
| ItemConfigDistance | grid.* | 图表边距 |

## 数据绑定结构
```json
{
  "data": [
    { "name": "类别名称", "value": 度量值 }
  ]
}
```

## 组件文件
- **属性配置**: `apps/funBI/src/views/build/components/buildConfig/baseComponent/echartsAttrs/echartfunnelAttrs.vue`
- **全局配置**: `apps/funBI/src/views/build/components/buildConfig/baseComponent/echartsGlobal/echartfunnelGlobal.vue`
- **系列配置**: `apps/funBI/src/views/build/components/buildConfig/baseComponent/echartsSeries/echartfunnelSeries.vue`
