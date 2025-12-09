# GIF Player Extension - 多平台构建脚本 (PowerShell)
# 用于打包 Chrome/Edge 和 Firefox 版本

Write-Host "开始构建 GIF Player Extension..." -ForegroundColor Cyan

# 清理旧构建
Write-Host "清理旧构建文件..." -ForegroundColor Yellow
if (Test-Path "build") {
    Remove-Item -Path "build" -Recurse -Force
}
New-Item -ItemType Directory -Path "build\chrome" -Force | Out-Null
New-Item -ItemType Directory -Path "build\firefox" -Force | Out-Null

# 定义要复制的文件
$files = @(
    "background.js",
    "content.js",
    "gifuct-js.js",
    "popup.html",
    "popup.js",
    "style.css"
)

# Chrome/Edge 版本
Write-Host "构建 Chrome/Edge 版本..." -ForegroundColor Yellow
Copy-Item -Path "icons" -Destination "build\chrome\icons" -Recurse
foreach ($file in $files) {
    Copy-Item -Path $file -Destination "build\chrome\"
}
Copy-Item -Path "manifest.json" -Destination "build\chrome\"

# 压缩 Chrome 版本
Compress-Archive -Path "build\chrome\*" -DestinationPath "build\gif-player-chrome.zip" -Force
Write-Host "✓ Chrome/Edge 版本已创建: build\gif-player-chrome.zip" -ForegroundColor Green

# Firefox 版本
Write-Host "构建 Firefox 版本..." -ForegroundColor Yellow
Copy-Item -Path "icons" -Destination "build\firefox\icons" -Recurse
foreach ($file in $files) {
    Copy-Item -Path $file -Destination "build\firefox\"
}
Copy-Item -Path "manifest-firefox.json" -Destination "build\firefox\manifest.json"

# 压缩 Firefox 版本
Compress-Archive -Path "build\firefox\*" -DestinationPath "build\gif-player-firefox.zip" -Force
Write-Host "✓ Firefox 版本已创建: build\gif-player-firefox.zip" -ForegroundColor Green

Write-Host ""
Write-Host "构建完成!" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Chrome/Edge: build\gif-player-chrome.zip" -ForegroundColor White
Write-Host "Firefox:     build\gif-player-firefox.zip" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
