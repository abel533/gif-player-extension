# 图标资源说明

## 图标文件

本目录应包含以下尺寸的图标文件:

- `icon-16.png` - 16x16 像素
- `icon-32.png` - 32x32 像素
- `icon-48.png` - 48x48 像素
- `icon-128.png` - 128x128 像素

## 图标要求

### 通用要求

- **格式**: PNG
- **背景**: 透明或纯色
- **设计**: 简洁清晰,在小尺寸下可辨认
- **主题**: 与 GIF 播放控制相关

### 各尺寸用途

| 尺寸 | 用途 |
|------|------|
| 16x16 | 浏览器工具栏图标 (最小显示) |
| 32x32 | Windows 系统托盘 |
| 48x48 | 扩展管理页面 |
| 128x128 | Chrome Web Store 展示 |

## 设计建议

### 主题元素

可以包含以下元素:
- 播放按钮符号 (▶)
- GIF 文字或标识
- 进度条图形
- 动画/运动相关图形

### 配色方案

基于项目主题的建议配色:
- **主色**: #6366F1 (紫色)
- **辅色**: #3B82F6 (蓝色)
- **渐变**: 紫色到蓝色的渐变效果

### 设计工具

推荐使用以下工具创建图标:

1. **在线工具**:
   - [Figma](https://figma.com) - 免费,功能强大
   - [Canva](https://canva.com) - 简单易用
   - [Favicon Generator](https://www.favicon-generator.org/) - 自动生成多尺寸

2. **桌面软件**:
   - Adobe Illustrator - 矢量图形
   - Adobe Photoshop - 位图编辑
   - GIMP - 免费开源

3. **图标库**:
   - [Material Icons](https://fonts.google.com/icons)
   - [Font Awesome](https://fontawesome.com)
   - [Heroicons](https://heroicons.com)

## 快速生成方法

### 方法一: 使用 AI 生成

已在 artifacts 目录中生成了一个基础图标设计。您可以:

1. 使用图像编辑软件打开生成的图标
2. 调整大小到所需尺寸
3. 导出为 PNG 格式

### 方法二: 使用在线工具

1. 访问 [Favicon Generator](https://www.favicon-generator.org/)
2. 上传一个大尺寸图片 (建议 512x512 或更大)
3. 自动生成所有需要的尺寸
4. 下载并重命名文件

### 方法三: 使用命令行工具

如果您有 ImageMagick 或类似工具:

```bash
# 从大图生成各种尺寸
convert source.png -resize 16x16 icon-16.png
convert source.png -resize 32x32 icon-32.png
convert source.png -resize 48x48 icon-48.png
convert source.png -resize 128x128 icon-128.png
```

## 检查清单

创建图标后,请确认:

- [ ] 所有 4 个尺寸都已创建
- [ ] 文件名正确 (icon-16.png, icon-32.png, icon-48.png, icon-128.png)
- [ ] 图标在小尺寸下清晰可辨
- [ ] 背景透明或与主题一致
- [ ] 文件大小合理 (每个文件 < 50KB)

## 临时方案

如果暂时没有设计好的图标,可以:

1. 使用简单的文字图标 (如 "GIF" 或播放符号)
2. 使用纯色背景 + 白色图标
3. 先用占位图标发布,后续更新

**注意**: 商店审核可能对图标质量有要求,建议使用专业设计的图标。
