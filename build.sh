#!/bin/bash

# GIF Player Extension - 多平台构建脚本
# 用于打包 Chrome/Edge 和 Firefox 版本

echo "开始构建 GIF Player Extension..."

# 清理旧构建
echo "清理旧构建文件..."
rm -rf build/
mkdir -p build/chrome build/firefox

# 定义要复制的文件
FILES="background.js content.js gifuct-js.js popup.html popup.js style.css"

# Chrome/Edge 版本
echo "构建 Chrome/Edge 版本..."
cp -r icons $FILES build/chrome/
cp manifest.json build/chrome/
cd build/chrome && zip -r ../gif-player-chrome.zip . && cd ../..
echo "✓ Chrome/Edge 版本已创建: build/gif-player-chrome.zip"

# Firefox 版本
echo "构建 Firefox 版本..."
cp -r icons $FILES build/firefox/
cp manifest-firefox.json build/firefox/manifest.json
cd build/firefox && zip -r ../gif-player-firefox.zip . && cd ../..
echo "✓ Firefox 版本已创建: build/gif-player-firefox.zip"

echo ""
echo "构建完成!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Chrome/Edge: build/gif-player-chrome.zip"
echo "Firefox:     build/gif-player-firefox.zip"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
