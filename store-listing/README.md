# GIF Player Extension - 商店列表配置

本目录包含在各个浏览器插件商店发布时需要的配置信息和资源文件。

## 目录结构

```
store-listing/
├── description-zh.md       # 中文商店描述
├── description-en.md       # 英文商店描述
├── screenshots/            # 截图目录
│   ├── screenshot-1.png   # 主界面截图 (1280x800)
│   ├── screenshot-2.png   # 设置面板截图
│   └── screenshot-3.png   # 使用场景截图
└── promotional/            # 宣传图目录
    ├── small-tile.png     # 小型宣传图块 (440x280)
    ├── large-tile.png     # 大型宣传图块 (920x680)
    └── marquee.png        # 侯爵图块 (1400x560)
```

## 需要准备的资源

### 1. 截图 (Screenshots)

**要求**:
- 尺寸: 1280x800 或 640x400 像素
- 格式: PNG 或 JPEG
- 数量: 至少 1 张,最多 5 张

**建议内容**:
1. GIF 播放控制界面 - 展示鼠标悬停时的控制条
2. 设置面板 - 展示自动加载开关
3. 实际使用场景 - 在真实网页上的效果
4. 进度条拖动 - 展示帧控制功能
5. 多 GIF 场景 - 展示智能加载管理

**制作建议**:
- 使用真实的网页场景
- 添加简短的文字说明
- 保持界面清晰,避免杂乱
- 使用高质量的 GIF 示例

### 2. 宣传图块 (Promotional Tiles)

#### 小型宣传图块 (Small Tile)
- 尺寸: 440x280 像素
- 用途: 搜索结果、分类页面
- 必需: Chrome, Edge

#### 大型宣传图块 (Large Tile)
- 尺寸: 920x680 像素
- 用途: 特色展示
- 可选: Chrome, Edge

#### 侯爵图块 (Marquee)
- 尺寸: 1400x560 像素
- 用途: 商店首页推荐
- 可选: Chrome

**设计建议**:
- 使用插件图标和名称
- 简洁明了的功能说明
- 吸引人的视觉设计
- 与插件主题色保持一致

### 3. 图标 (Icons)

已在 `icons/` 目录中准备:
- icon-16.png (16x16)
- icon-32.png (32x32)
- icon-48.png (48x48)
- icon-128.png (128x128)

## 商店描述

### 中文描述 (description-zh.md)

用于:
- Chrome Web Store (中文市场)
- Edge Add-ons (中文)
- Firefox Add-ons (中文本地化)

### 英文描述 (description-en.md)

用于:
- Chrome Web Store (国际市场)
- Edge Add-ons (英文)
- Firefox Add-ons (默认语言)

## 使用说明

### Chrome Web Store

1. 登录 [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. 上传插件 ZIP 包
3. 填写商店列表:
   - 复制 `description-en.md` 内容到详细说明
   - 上传 `screenshots/` 中的截图
   - 上传 `promotional/small-tile.png`
   - (可选) 上传大型宣传图块和侯爵图块

### Edge Add-ons

1. 登录 [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
2. 上传插件 ZIP 包
3. 添加英文和中文两个语言版本:
   - 英文: 使用 `description-en.md`
   - 中文: 使用 `description-zh.md`
4. 上传截图和宣传图

### Firefox Add-ons

1. 登录 [Developer Hub](https://addons.mozilla.org/developers/)
2. 上传插件 ZIP 包
3. 填写英文信息 (使用 `description-en.md`)
4. 添加中文本地化 (使用 `description-zh.md`)
5. 上传截图

## 制作截图的步骤

### 1. 准备测试环境

1. 在浏览器中加载未打包的扩展
2. 访问包含 GIF 的测试网页 (如 giphy.com)
3. 确保扩展正常工作

### 2. 截图工具

**Windows**:
- 使用 Windows + Shift + S (截图工具)
- 或使用 Snagit, ShareX 等专业工具

**Mac**:
- 使用 Cmd + Shift + 4 (区域截图)
- 或使用 Skitch, CleanShot X 等工具

### 3. 编辑截图

1. 裁剪到合适尺寸 (1280x800 推荐)
2. 添加箭头或高亮标注关键功能
3. (可选) 添加简短文字说明
4. 保存为 PNG 格式

### 4. 优化文件大小

```bash
# 使用 ImageOptim (Mac) 或 TinyPNG
# 或使用命令行工具
pngquant screenshot-1.png --output screenshot-1-optimized.png
```

## 制作宣传图的建议

### 使用设计工具

- **Figma**: 免费,功能强大
- **Canva**: 简单易用,有模板
- **Photoshop**: 专业工具

### 设计元素

1. **背景**: 使用渐变或纯色,与插件主题一致
2. **图标**: 放置插件图标 (128x128)
3. **标题**: 插件名称,使用清晰的字体
4. **功能点**: 3-5 个关键功能,使用图标或简短文字
5. **视觉元素**: GIF 播放控制的示意图

### 配色建议

基于插件图标的紫蓝渐变主题:
- 主色: #6366F1 (紫色)
- 辅色: #3B82F6 (蓝色)
- 背景: #1E293B (深色) 或 #F8FAFC (浅色)
- 文字: #FFFFFF (深色背景) 或 #1E293B (浅色背景)

## 检查清单

发布前确认:

- [ ] 至少准备 1 张截图 (1280x800)
- [ ] 准备小型宣传图块 (440x280) - Chrome/Edge 必需
- [ ] 检查所有图片清晰度
- [ ] 确认图片尺寸符合要求
- [ ] 优化图片文件大小
- [ ] 准备中英文描述文本
- [ ] 检查描述中的链接有效性
- [ ] 确认隐私政策 URL 可访问

## 参考资源

- [Chrome Web Store 图片资源指南](https://developer.chrome.com/docs/webstore/images/)
- [Edge Add-ons 提交指南](https://docs.microsoft.com/microsoft-edge/extensions-chromium/publish/publish-extension)
- [Firefox 扩展图标指南](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/)
