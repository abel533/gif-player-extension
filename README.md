# GIF Player Extension

[English](README_en.md)

一个智能的浏览器扩展,为网页上的 GIF 动图提供完整的播放控制功能。

### ✨ 功能特点

- 🎮 **完整的播放控制** - 为 GIF 图片添加播放/暂停按钮
- 📊 **精确的进度控制** - 拖动进度条跳转到任意帧
- ⚡ **智能加载管理** - 自动检测页面 GIF 数量,智能决定是否自动加载
- 🎯 **智能过滤** - 自动忽略小于 200x100 像素的小图标
- 🎨 **优雅的界面** - 简洁美观,鼠标悬停显示,不影响浏览体验
- ⚙️ **可自定义设置** - 在弹出菜单中控制自动加载行为

### 🚀 使用场景

- 浏览包含大量 GIF 的社交媒体网站
- 查看技术文档中的动画演示
- 控制论坛和博客中的动图播放

### 示例

#### gif

![](demo/1.gif)

![](demo/2.gif)

![](demo/3.gif)

![](demo/4.gif)

![](demo/5.gif)

#### webp

![](demo/2.webp)

![](demo/3.webp)


### 📦 安装

#### 从商店安装 (推荐)

- **Chrome Web Store**: [即将上线]
- **Edge Add-ons**: [即将上线]
- **Firefox Add-ons**: [即将上线]

#### 手动安装 (开发版)

1. 克隆或下载此仓库
2. 打开浏览器扩展管理页面:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Firefox: `about:debugging#/runtime/this-firefox`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"(Chrome/Edge) 或"临时载入附加组件"(Firefox)
5. 选择项目目录

**注意**: Firefox 需要使用 `manifest-firefox.json`,请先将其重命名为 `manifest.json`

### 🎯 使用方法

1. 安装扩展后,访问任何包含 GIF 图片的网页
2. 将鼠标悬停在 GIF 图片上,会显示播放控制条
3. 点击播放/暂停按钮控制 GIF 播放
4. 拖动进度条跳转到任意帧
5. 点击扩展图标打开设置,切换自动加载选项

### 🛠️ 开发

#### 项目结构

```
gif-player-extension/
├── manifest.json              # Chrome/Edge 配置
├── manifest-firefox.json      # Firefox 配置
├── background.js              # 后台脚本
├── content.js                 # 内容脚本
├── popup.html                 # 设置界面
├── popup.js                   # 设置逻辑
├── style.css                  # 样式
├── gifuct-js.js               # GIF 解析库
└── icons/                     # 图标资源
```

#### 构建

```bash
# Windows
.\build.ps1

# Linux/Mac
chmod +x build.sh
./build.sh
```

构建输出:
- `build/gif-player-chrome.zip` - Chrome/Edge 版本
- `build/gif-player-firefox.zip` - Firefox 版本

### 📝 隐私政策

本扩展不收集、存储或传输任何用户数据。所有设置都保存在浏览器本地存储中。

详见 [PRIVACY.md](PRIVACY.md)

### 📄 许可证

本项目基于 [GPLv3](LICENSE) 许可证开源。

---

**Made with ❤️ for a better web browsing experience**
