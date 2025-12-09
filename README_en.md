# GIF Player Extension

[中文](README.md)

A smart browser extension that provides complete playback control for GIF animations on web pages.

### ✨ Features

- 🎮 **Complete Playback Control** - Add play/pause buttons to GIF images
- 📊 **Precise Progress Control** - Drag progress bar to jump to any frame
- ⚡ **Smart Loading Management** - Automatically detect GIF count and decide whether to auto-load
- 🎯 **Smart Filtering** - Automatically ignore small icons under 200x100 pixels
- 🎨 **Elegant Interface** - Clean and beautiful, shows on hover, doesn't interfere with browsing
- ⚙️ **Customizable Settings** - Control auto-load behavior in popup menu

### 🚀 Use Cases

- Browse social media sites with lots of GIFs
- View animated demos in technical documentation
- Control animated images in forums and blogs

### 📸 Examples

#### GIF

![](demo/1.gif)

![](demo/2.gif)

![](demo/3.gif)

![](demo/4.gif)

![](demo/5.gif)

#### WebP

![](demo/2.webp)

![](demo/3.webp)


### 📦 Installation

#### From Store (Recommended)

- **Chrome Web Store**: [Coming Soon]
- **Edge Add-ons**: [Coming Soon]
- **Firefox Add-ons**: [Coming Soon]

#### Manual Installation (Development)

1. Clone or download this repository
2. Open browser extension management page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Firefox: `about:debugging#/runtime/this-firefox`
3. Enable "Developer mode"
4. Click "Load unpacked" (Chrome/Edge) or "Load Temporary Add-on" (Firefox)
5. Select the project directory

**Note**: For Firefox, use `manifest-firefox.json` by renaming it to `manifest.json`.

### 🎯 Usage

1. After installing the extension, visit any webpage with GIF images
2. Hover over a GIF image to see the playback control bar
3. Click play/pause button to control GIF playback
4. Drag the progress bar to jump to any frame
5. Click the extension icon to open settings and toggle auto-load option

### 🛠️ Development

#### Project Structure

```
gif-player-extension/
├── manifest.json              # Chrome/Edge config
├── manifest-firefox.json      # Firefox config
├── background.js              # Background script
├── content.js                 # Content script
├── popup.html                 # Settings UI
├── popup.js                   # Settings logic
├── style.css                  # Styles
├── gifuct-js.js               # GIF parser library
└── icons/                     # Icon resources
```

#### Build

```bash
# Windows
.\build.ps1

# Linux/Mac
chmod +x build.sh
./build.sh
```

Build output:
- `build/gif-player-chrome.zip` - Chrome/Edge version
- `build/gif-player-firefox.zip` - Firefox version

### 📝 Privacy Policy

This extension does not collect, store, or transmit any user data. All settings are saved in browser local storage.

See [PRIVACY.md](PRIVACY.md) for details.

### 📄 License

This project is licensed under the [GPLv3](LICENSE).

---

**Made with ❤️ for a better web browsing experience**
