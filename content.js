(function () {
    'use strict';

    // ==================== 调试开关 ====================
    const DEBUG = false; // 设置为 true 开启日志输出

    // 自定义日志方法
    const log = (...args) => {
        if (DEBUG) console.log(...args);
    };
    const error = (...args) => {
        if (DEBUG) console.error(...args);
    };

    log('🎬 GIF 播放控制器脚本开始加载...');

    // ==================== 全局配置 ====================
    let config = {
        minWidth: 200,
        minHeight: 100,
        maxAutoLoadCount: 4,
        autoPlayEnabled: true,
        autoLoadEnabled: true,
        disabledDomains: []
    };

    // ==================== 全局状态 ====================
    let pageTemporaryDisabled = false;  // 页面临时禁用状态
    let allControllers = [];            // 所有 GifController 实例

    // 获取当前域名
    function getCurrentDomain() {
        try {
            return window.location.hostname;
        } catch {
            return '';
        }
    }

    // 检查当前域名是否被禁用
    function isDomainDisabled() {
        const domain = getCurrentDomain();
        return config.disabledDomains.includes(domain);
    }

    // 清理所有 GIF 控制器
    function cleanupAllControllers() {
        log('🧹 清理所有 GIF 控制器，共', allControllers.length, '个');
        allControllers.forEach(controller => {
            try {
                controller.cleanup();
            } catch (e) {
                error('清理控制器失败:', e);
            }
        });
        allControllers = [];
    }

    // 配置是否已加载
    let configLoaded = false;
    let initPending = false;

    // ==================== WebP 检测工具 ====================

    // 检查是否为 WebP 图片
    function isWebP(src) {
        return src.toLowerCase().includes('.webp');
    }

    // 检测 WebP 是否包含动画 (检查 VP8X chunk 和 Animation flag)
    async function isAnimatedWebP(src) {
        try {
            const response = await fetch(src, {
                headers: { 'Range': 'bytes=0-255' } // 尝试只获取头部
            });

            // 如果服务器不支持 Range，会返回 200 和整个文件，也没关系，我们只读流的开头
            if (!response.body) {
                const buffer = await response.arrayBuffer();
                return checkWebPHeader(new Uint8Array(buffer));
            }

            const reader = response.body.getReader();
            const { value, done } = await reader.read();
            reader.cancel(); // 只需要头部，读完就取消

            if (done || !value) return false;
            return checkWebPHeader(value);
        } catch (e) {
            error('WebP 检测失败:', src, e);
            return false;
        }
    }

    function checkWebPHeader(data) {
        // 最小 WebP 头长度: RIFF(4) + Size(4) + WEBP(4) + VP8X(4) + Size(4) + Flags(4) = 24 bytes
        if (data.length < 24) return false;

        // 检查 RIFF
        if (data[0] !== 0x52 || data[1] !== 0x49 || data[2] !== 0x46 || data[3] !== 0x46) return false;
        // 检查 WEBP
        if (data[8] !== 0x57 || data[9] !== 0x45 || data[10] !== 0x42 || data[11] !== 0x50) return false;

        // 查找 VP8X chunk
        // Chunk ID 在 12-15
        if (data[12] !== 0x56 || data[13] !== 0x50 || data[14] !== 0x38 || data[15] !== 0x58) {
            // 如果不是 VP8X，则不是扩展格式，肯定不是动图
            return false;
        }

        // 检查 Flags (offset 20)
        // Animation bit 是第 2 位 (0x02)
        // Bits: Rsv|I|L|E|M|A|R|...
        // byte 20: [Rsv:2][ICC:1][Alpha:1][Exif:1][XMP:1][Anim:1][Rsv:1] -> 实际上是 int32 读法？
        // 根据规范 VP8XPayload:
        // 1 byte flags:
        // bit 0: reserved
        // bit 1: Animation
        // bit 2: XMP
        // bit 3: Exif
        // bit 4: Alpha
        // bit 5: ICC
        // ...
        // 注意：WebP 格式文档中位的顺序。通常 byte 20 的掩码 0x02 表示 Animation。

        const flags = data[20];
        const isAnimated = (flags & 0x02) !== 0;

        return isAnimated;
    }

    // 从存储读取配置
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get([
            'minWidth',
            'minHeight',
            'maxAutoLoadCount',
            'autoPlayEnabled',
            'autoLoadEnabled',
            'disabledDomains'
        ], (result) => {
            config.minWidth = result.minWidth ?? 200;
            config.minHeight = result.minHeight ?? 100;
            config.maxAutoLoadCount = result.maxAutoLoadCount ?? 4;
            config.autoPlayEnabled = result.autoPlayEnabled !== false;
            config.autoLoadEnabled = result.autoLoadEnabled !== false;
            config.disabledDomains = result.disabledDomains ?? [];
            log('📦 已加载配置:', config);

            configLoaded = true;
            // 如果有待处理的初始化，现在执行
            if (initPending) {
                initPending = false;
                initGifControls();
            }
        });

        // 监听配置变化
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync') {
                if (changes.minWidth) config.minWidth = changes.minWidth.newValue;
                if (changes.minHeight) config.minHeight = changes.minHeight.newValue;
                if (changes.maxAutoLoadCount) config.maxAutoLoadCount = changes.maxAutoLoadCount.newValue;
                if (changes.autoPlayEnabled) config.autoPlayEnabled = changes.autoPlayEnabled.newValue;
                if (changes.autoLoadEnabled) config.autoLoadEnabled = changes.autoLoadEnabled.newValue;
                if (changes.disabledDomains) config.disabledDomains = changes.disabledDomains.newValue;
                log('🔄 配置已更新:', config);
            }
        });

        // 监听来自 popup 的消息
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'GIF_CONFIG_UPDATE') {
                if (message.minWidth !== undefined) config.minWidth = message.minWidth;
                if (message.minHeight !== undefined) config.minHeight = message.minHeight;
                if (message.maxAutoLoadCount !== undefined) config.maxAutoLoadCount = message.maxAutoLoadCount;
                if (message.autoPlayEnabled !== undefined) config.autoPlayEnabled = message.autoPlayEnabled;
                if (message.autoLoadEnabled !== undefined) config.autoLoadEnabled = message.autoLoadEnabled;
                log('📩 收到配置更新:', config);
            } else if (message.type === 'GIF_TEMP_DISABLE') {
                pageTemporaryDisabled = message.disabled;
                log('🚫 页面临时禁用状态:', pageTemporaryDisabled);
                if (pageTemporaryDisabled) {
                    cleanupAllControllers();
                }
            } else if (message.type === 'GIF_DOMAIN_DISABLE_CHANGED') {
                if (message.disabled) {
                    cleanupAllControllers();
                }
            }
        });
    } else {
        // 如果没有 chrome.storage，直接标记为已加载
        configLoaded = true;
    }

    // ==================== GIF 控制器类 ====================
    class GifController {
        constructor(img) {
            this.img = img;
            this.frames = [];
            this.frameIndex = 0;
            this.playing = false;
            this.needsDisposal = false;
            this.playbackSpeed = 1.0;
            this.isWebP = isWebP(img.src); // 标记是否为 WebP

            // canvas 元素
            this.canvas = null;
            this.ctx = null;
            this.tempCanvas = null;
            this.tempCtx = null;
            this.gifCanvas = null;
            this.gifCtx = null;

            this.controlBar = null;
            this.animationId = null;
            this.isProcessing = false;
            this.wrapper = null;
            this.frameImageData = null;

            this.aspectRatio = 1;
            this.enableResize = false;
            this.resizeHandle = null;

            this.gifWidth = 0;
            this.gifHeight = 0;

            // 存储父链接引用
            this.parentLink = null;

            // 是否已完成加载（用于控制 overlay 按钮显示）
            this.loaded = false;
        }

        async init() {
            if (this.isProcessing) return;
            this.isProcessing = true;

            try {
                this.showLoading();
                await this.loadGif();
                this.aspectRatio = (this.gifWidth && this.gifHeight) ? (this.gifWidth / this.gifHeight) : 1;
                this.enableResize = isStandaloneImagePage(this.img);
                this.createCanvas();
                this.createUI();
                // 显示第一帧
                this.drawPatch(this.frames[0]);
                this.copyToDisplay();
                this.hideLoading();
                // 标记已加载，隐藏 overlay 按钮
                this.loaded = true;
                this.wrapper.classList.add('loaded');
                // 根据配置决定是否自动播放
                if (config.autoPlayEnabled) {
                    this.play();
                }
                // 添加到控制器列表
                allControllers.push(this);
            } catch (e) {
                error('GIF 加载失败:', e);
                this.hideLoading();
                // 恢复原始图片显示
                this.cleanup();
            } finally {
                this.isProcessing = false;
            }
        }

        cleanup() {
            // 停止播放
            this.pause();

            // 清理 WebP 帧资源 (ImageBitmap)
            if (this.frames && this.frames.length > 0) {
                this.frames.forEach(frame => {
                    if (frame.bitmap && typeof frame.bitmap.close === 'function') {
                        frame.bitmap.close();
                    }
                });
            }
            this.frames = [];

            // 恢复图片显示
            this.img.style.display = '';
            // 重置标记
            delete this.img.dataset.gifControlled;
            if (this.wrapper) {
                // 将 img 移回原位置
                if (this.parentLink) {
                    // 恢复 <a> 标签的样式
                    if (this.originalLinkStyle) {
                        this.parentLink.style.height = this.originalLinkStyle.height;
                        this.parentLink.style.overflow = this.originalLinkStyle.overflow;
                        this.parentLink.style.display = this.originalLinkStyle.display;
                    }
                    // 如果原本有父链接，把链接移回原位置，图片留在链接内
                    this.wrapper.parentNode.insertBefore(this.parentLink, this.wrapper);
                } else {
                    this.wrapper.parentNode.insertBefore(this.img, this.wrapper);
                }
                this.wrapper.remove();
                this.wrapper = null;
            }
            // 从控制器列表移除
            const index = allControllers.indexOf(this);
            if (index > -1) {
                allControllers.splice(index, 1);
            }
        }

        showLoading() {
            // 创建包装器，在原位置替换图片
            this.wrapper = document.createElement('div');
            this.wrapper.className = 'gif-player-wrapper';

            // 获取图片的计算样式
            const rect = this.img.getBoundingClientRect();
            this.wrapper.style.width = rect.width + 'px';
            this.wrapper.style.height = rect.height + 'px';

            // 检查图片是否被 <a> 标签包裹
            this.parentLink = this.img.closest('a');

            if (this.parentLink) {
                // 如果图片在 <a> 中，将 wrapper 插入到 <a> 外面
                // 然后把 <a>（包含图片）移入 wrapper
                this.parentLink.parentNode.insertBefore(this.wrapper, this.parentLink);
                this.wrapper.appendChild(this.parentLink);

                // 保存并隐藏 <a> 标签，避免其占用高度（兼容 giphy.com）
                this.originalLinkStyle = {
                    height: this.parentLink.style.height,
                    overflow: this.parentLink.style.overflow,
                    display: this.parentLink.style.display
                };
                this.parentLink.style.height = '0';
                this.parentLink.style.overflow = 'hidden';
            } else {
                // 普通情况：wrapper 插入到图片位置，图片移入 wrapper
                this.img.parentNode.insertBefore(this.wrapper, this.img);
                this.wrapper.appendChild(this.img);
            }

            this.img.style.display = 'none';

            this.loadingEl = document.createElement('div');
            this.loadingEl.className = 'gif-loading';
            this.loadingEl.textContent = '加载中...';
            this.wrapper.appendChild(this.loadingEl);
        }

        hideLoading() {
            if (this.loadingEl) {
                this.loadingEl.remove();
                this.loadingEl = null;
            }
        }

        async loadGif() {
            if (this.isWebP) {
                await this.loadWebP();
            } else {
                await this.loadLegacyGif();
            }
        }

        async loadWebP() {
            if (typeof ImageDecoder === 'undefined') {
                throw new Error('当前浏览器不支持 ImageDecoder API，无法播放 WebP 动图');
            }

            const response = await fetch(this.img.src);
            if (!response.body) throw new Error('无法获取 WebP 内容');

            // ImageDecoder 需要 type 和 data (BufferSource | ReadableStream)
            // 使用 stream 可能更高效，但为了简单获取所有帧，先用 buffer 也可以，或者直接给 stream
            // 注意：ImageDecoder 使用 complete frames，不需要手动处理 disposal/patch

            const buffer = await response.arrayBuffer();
            const decoder = new ImageDecoder({ data: buffer, type: 'image/webp' });

            // 等待元数据加载
            await decoder.tracks.ready;
            const track = decoder.tracks.selectedTrack;

            if (!track || !track.animated) {
                throw new Error('该 WebP 图片不是动图');
            }

            this.gifWidth = decoder.type === 'image/webp' ? this.img.naturalWidth : 0;
            // 重新获取准确尺寸（ImageDecoder 不直接暴露 width/height 属性在 decoder 上，需从 decoded frame 获取或 img 获取）
            // 我们可以解码第一帧来确认尺寸

            this.frames = [];
            const frameCount = track.frameCount;

            log(`WebP 检测到 ${frameCount} 帧`);
            for (let i = 0; i < frameCount; i++) {
                const result = await decoder.decode({ frameIndex: i });
                // result.image 是 ImageBitmap
                // result.duration 是持续时间 (微秒)，需要转为毫秒
                // ImageBitmap 的 width/height 是真实的
                if (i === 0) {
                    this.gifWidth = result.image.displayWidth;
                    this.gifHeight = result.image.displayHeight;
                }

                this.frames.push({
                    bitmap: result.image,
                    delay: result.duration / 1000,
                    dims: { width: result.image.displayWidth, height: result.image.displayHeight } // 兼容性字段
                });
            }

            log(`WebP 加载成功: ${this.frames.length} 帧, 尺寸: ${this.gifWidth}x${this.gifHeight}`);
        }

        async loadLegacyGif() {
            const response = await fetch(this.img.src);
            const buffer = await response.arrayBuffer();
            const gif = gifuct.parseGIF(buffer);
            this.frames = gifuct.decompressFrames(gif, true);
            this.gifWidth = gif.width;
            this.gifHeight = gif.height;
            log(`GIF 加载成功: ${this.frames.length} 帧, 尺寸: ${this.gifWidth}x${this.gifHeight}`);
        }

        createCanvas() {
            // 用户可见的显示 canvas
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.gifWidth;
            this.canvas.height = this.gifHeight;
            this.canvas.className = 'gif-display-canvas';
            this.ctx = this.canvas.getContext('2d');

            // 临时 canvas 用于绘制帧补丁
            this.tempCanvas = document.createElement('canvas');
            this.tempCtx = this.tempCanvas.getContext('2d');

            // 完整 GIF canvas 用于累积帧
            this.gifCanvas = document.createElement('canvas');
            this.gifCanvas.width = this.gifWidth;
            this.gifCanvas.height = this.gifHeight;
            this.gifCtx = this.gifCanvas.getContext('2d');

            this.wrapper.appendChild(this.canvas);

            // 点击 canvas 切换播放状态
            this.canvas.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.togglePlay();
            }, true);
        }

        createUI() {
            // 底部控制栏（不再创建 overlay 按钮，进度条加载后不需要）
            this.controlBar = document.createElement('div');
            this.controlBar.className = 'gif-control-bar';

            // 播放/暂停按钮
            this.playBtn = document.createElement('button');
            this.playBtn.className = 'gif-play-btn';
            this.playBtn.innerHTML = '▶'; // 初始为播放图标
            this.playBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.togglePlay();
            }, true);

            // 进度条
            this.progressBar = document.createElement('input');
            this.progressBar.type = 'range';
            this.progressBar.className = 'gif-progress';
            this.progressBar.min = '0';
            this.progressBar.max = String(this.frames.length - 1);
            this.progressBar.value = '0';
            this.updateProgressVisual();

            this.progressBar.addEventListener('input', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.pause();
                this.seekToFrame(parseInt(e.target.value));
            }, true);

            this.progressBar.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }, true);

            // 速度减少按钮
            this.speedDownBtn = document.createElement('button');
            this.speedDownBtn.className = 'gif-speed-btn';
            this.speedDownBtn.innerHTML = '-';
            this.speedDownBtn.title = '减速';
            this.speedDownBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.decreaseSpeed();
            }, true);

            // 速度显示
            this.speedDisplay = document.createElement('span');
            this.speedDisplay.className = 'gif-speed-display';
            this.updateSpeedDisplay();

            // 速度增加按钮
            this.speedUpBtn = document.createElement('button');
            this.speedUpBtn.className = 'gif-speed-btn';
            this.speedUpBtn.innerHTML = '+';
            this.speedUpBtn.title = '加速';
            this.speedUpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.increaseSpeed();
            }, true);

            // 帧信息
            this.frameInfo = document.createElement('span');
            this.frameInfo.className = 'gif-frame-info';
            this.updateFrameInfo();

            // 新标签页打开按钮
            const imgSrc = this.img.src;
            this.openBtn = document.createElement('button');
            this.openBtn.className = 'gif-open-btn';
            this.openBtn.title = '在新标签页打开';
            this.openBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="currentColor"/>
                </svg>
            `;
            this.openBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                window.open(imgSrc, '_blank');
            }, true);

            this.controlBar.appendChild(this.playBtn);
            this.controlBar.appendChild(this.progressBar);
            this.controlBar.appendChild(this.frameInfo);
            this.controlBar.appendChild(this.speedDownBtn);
            this.controlBar.appendChild(this.speedDisplay);
            this.controlBar.appendChild(this.speedUpBtn);
            this.controlBar.appendChild(this.openBtn);

            this.wrapper.appendChild(this.controlBar);

            if (this.enableResize) {
                this.initResizeHandle();
            }

            // 显示控制栏
            this.wrapper.classList.add('active');
        }

        initResizeHandle() {
            this.controlBar.classList.add('has-resize-handle');
            this.resizeHandle = document.createElement('div');
            this.resizeHandle.className = 'gif-resize-handle';
            this.resizeHandle.title = '拖拽缩放';

            const onPointerDown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                const startX = e.clientX;
                const rect = this.wrapper.getBoundingClientRect();
                const startWidth = rect.width;
                const aspect = this.aspectRatio || (rect.width / Math.max(rect.height, 1));
                // 最小宽度：不超过 200，同时不超过原始宽度
                const minWidth = Math.max(40, Math.min(200, this.gifWidth || 200));

                const viewportWidth = Math.max(1, window.innerWidth || startWidth);
                const viewportHeight = Math.max(1, window.innerHeight || rect.height);
                // 按比例不得超过窗口宽或高
                const maxWidthByWidth = viewportWidth;
                const maxWidthByHeight = viewportHeight * aspect;
                const maxWidth = Math.max(minWidth, Math.min(maxWidthByWidth, maxWidthByHeight));

                const onPointerMove = (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    const deltaX = ev.clientX - startX;
                    const nextWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + deltaX));
                    const nextHeight = nextWidth / aspect;
                    this.wrapper.style.width = `${nextWidth}px`;
                    this.wrapper.style.height = '';
                    this.canvas.style.height = `${nextHeight}px`;
                };

                const onPointerUp = (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    document.removeEventListener('pointermove', onPointerMove, true);
                    document.removeEventListener('pointerup', onPointerUp, true);
                };

                document.addEventListener('pointermove', onPointerMove, true);
                document.addEventListener('pointerup', onPointerUp, true);
            };

            this.resizeHandle.addEventListener('pointerdown', onPointerDown, true);

            this.controlBar.appendChild(this.resizeHandle);
        }

        // 按照官方 demo 的方式绘制帧补丁
        drawPatch(frame) {
            if (this.isWebP) {
                // WebP 逻辑：直接绘制 ImageBitmap
                // WebP 通过 ImageDecoder 得到的通常是完整帧，直接绘制即可
                if (frame.bitmap) {
                    // 清空当前画布 (对于透明背景很重要，但 WebP 动图每一帧如果是复合后的...)
                    // ImageDecoder 默认返回混合后的图像 (composed image)，所以直接覆盖即可
                    this.gifCtx.clearRect(0, 0, this.gifWidth, this.gifHeight);
                    this.gifCtx.drawImage(frame.bitmap, 0, 0);
                }
                return;
            }

            // GIF 逻辑
            const dims = frame.dims;

            // 如果尺寸变化，重新创建 ImageData
            if (!this.frameImageData ||
                dims.width !== this.frameImageData.width ||
                dims.height !== this.frameImageData.height) {
                this.tempCanvas.width = dims.width;
                this.tempCanvas.height = dims.height;
                this.frameImageData = this.tempCtx.createImageData(dims.width, dims.height);
            }

            // 设置补丁数据
            this.frameImageData.data.set(frame.patch);

            // 绘制补丁到临时 canvas
            this.tempCtx.putImageData(this.frameImageData, 0, 0);

            // 绘制到 GIF canvas 的正确位置
            this.gifCtx.drawImage(this.tempCanvas, dims.left, dims.top);
        }

        // 复制到显示 canvas
        copyToDisplay() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.gifCanvas, 0, 0);
        }

        // 渲染单帧 - 按照官方 demo 的逻辑
        renderFrame() {
            const frame = this.frames[this.frameIndex];

            // 处理上一帧的 disposal
            if (this.needsDisposal) {
                this.gifCtx.clearRect(0, 0, this.gifWidth, this.gifHeight);
                this.needsDisposal = false;
            }

            // 绘制当前帧补丁
            this.drawPatch(frame);

            // 复制到显示 canvas
            this.copyToDisplay();

            // 更新帧索引
            this.frameIndex++;
            if (this.frameIndex >= this.frames.length) {
                this.frameIndex = 0;
            }

            // 检查 disposal type (GIF Only)
            if (!this.isWebP && frame.disposalType === 2) {
                this.needsDisposal = true;
            }

            // 更新 UI
            this.updateUIState();

            // 继续播放
            if (this.playing) {
                const delay = (frame.delay || 100) / this.playbackSpeed;
                this.animationId = setTimeout(() => {
                    requestAnimationFrame(() => this.renderFrame());
                }, delay);
            }
        }

        // 跳转到指定帧
        seekToFrame(targetFrame) {
            // 需要从头重绘到目标帧
            this.gifCtx.clearRect(0, 0, this.gifWidth, this.gifHeight);
            this.needsDisposal = false;

            for (let i = 0; i <= targetFrame; i++) {
                const frame = this.frames[i];

                if (this.needsDisposal) {
                    this.gifCtx.clearRect(0, 0, this.gifWidth, this.gifHeight);
                    this.needsDisposal = false;
                }

                this.drawPatch(frame);

                if (frame.disposalType === 2 && !this.isWebP) {
                    this.needsDisposal = true;
                }
            }

            this.copyToDisplay();
            this.frameIndex = targetFrame;
            this.updateUIState();
        }

        togglePlay() {
            if (this.playing) {
                this.pause();
            } else {
                this.play();
            }
        }

        play() {
            if (this.playing) return;
            this.playing = true;
            this.wrapper.classList.add('playing');
            this.playBtn.innerHTML = '⏸';
            this.renderFrame();
        }

        pause() {
            this.playing = false;
            this.wrapper.classList.remove('playing');
            this.playBtn.innerHTML = '▶';
            if (this.animationId) {
                clearTimeout(this.animationId);
                this.animationId = null;
            }
        }

        updateUIState() {
            this.progressBar.value = String(this.frameIndex);
            this.updateProgressVisual();
            this.updateFrameInfo();
        }

        updateProgressVisual() {
            if (!this.progressBar) return;
            const min = parseInt(this.progressBar.min) || 0;
            const max = parseInt(this.progressBar.max) || 100;
            const val = parseInt(this.progressBar.value) || 0;

            // 避免除以零
            if (max <= min) return;

            const ratio = ((val - min) / (max - min)) * 100;
            this.progressBar.style.background = `linear-gradient(to right, white 0%, white ${ratio}%, rgba(255, 255, 255, 0.3) ${ratio}%, rgba(255, 255, 255, 0.3) 100%)`;
        }

        updateFrameInfo() {
            if (this.frameInfo) {
                this.frameInfo.textContent = `${this.frameIndex + 1}/${this.frames.length}`;
            }
        }

        getSpeedLevels() {
            return [0.1, 0.2, 0.4, 0.6, 1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0];
        }

        increaseSpeed() {
            const levels = this.getSpeedLevels();
            const currentIndex = levels.indexOf(this.playbackSpeed);
            if (currentIndex < levels.length - 1) {
                this.playbackSpeed = levels[currentIndex + 1];
                this.updateSpeedDisplay();
            }
        }

        decreaseSpeed() {
            const levels = this.getSpeedLevels();
            const currentIndex = levels.indexOf(this.playbackSpeed);
            if (currentIndex > 0) {
                this.playbackSpeed = levels[currentIndex - 1];
                this.updateSpeedDisplay();
            }
        }

        updateSpeedDisplay() {
            if (this.speedDisplay) {
                this.speedDisplay.textContent = `${this.playbackSpeed}x`;
            }
            const levels = this.getSpeedLevels();
            const currentIndex = levels.indexOf(this.playbackSpeed);
            if (this.speedDownBtn) {
                this.speedDownBtn.disabled = currentIndex === 0;
            }
            if (this.speedUpBtn) {
                this.speedUpBtn.disabled = currentIndex === levels.length - 1;
            }
        }
    }

    // ==================== 辅助函数 ====================

    // 检查图片是否为目标图片 (GIF 或 WebP)
    function isTargetImage(img) {
        const src = (img.src || '').toLowerCase();
        const srcset = (img.srcset || '').toLowerCase();

        // 检查 .gif
        const isGif = src.endsWith('.gif') ||
            src.includes('.gif?') ||
            src.includes('.gif#') ||
            srcset.includes('.gif');

        if (isGif) return true;

        // 检查 .webp
        const isWebP = src.endsWith('.webp') ||
            src.includes('.webp?') ||
            src.includes('.webp#') ||
            srcset.includes('.webp');

        return isWebP;
    }

    // 检查图片尺寸是否满足最小要求
    function meetsMinSize(img) {
        return img.naturalWidth >= config.minWidth || img.naturalHeight >= config.minHeight;
    }

    // 判断是否为独立图片标签页
    function isStandaloneImagePage(img) {
        const body = document.body;
        const contentType = (document.contentType || '').toLowerCase();
        const contentIsImage = contentType.startsWith('image/');
        const onlyImageInBody = body && body.childElementCount === 1 && body.firstElementChild === img;
        return contentIsImage || onlyImageInBody;
    }

    // ==================== 手动加载模式 ====================

    // 为图片创建手动加载的 wrapper 和 overlay 按钮
    function initManualGif(img) {
        if (img.dataset.gifControlled) {
            return;
        }

        // 确保图片已加载
        if (!img.complete || img.naturalWidth === 0) {
            img.addEventListener('load', () => {
                initManualGif(img);
            }, { once: true });
            return;
        }

        // 检查尺寸（宽高都小于 MIN_SIZE 时不处理）
        if (!meetsMinSize(img)) {
            log('  ⏭️ 跳过小尺寸 GIF:', img.src, `(${img.naturalWidth}x${img.naturalHeight})`);
            return;
        }

        log('  🔘 添加手动加载按钮:', img.src);

        img.dataset.gifControlled = 'true';

        // 检查是否被链接包裹，阻止链接跳转
        const parentLink = img.closest('a');
        if (parentLink) {
            parentLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, true);
        }

        // 创建 wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'gif-player-wrapper gif-manual-mode';

        const rect = img.getBoundingClientRect();
        wrapper.style.width = rect.width + 'px';

        if (parentLink) {
            parentLink.parentNode.insertBefore(wrapper, parentLink);
            wrapper.appendChild(parentLink);
        } else {
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);
        }

        // 创建 overlay 按钮
        const overlayBtn = document.createElement('div');
        overlayBtn.className = 'gif-overlay-btn';
        overlayBtn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
            </svg>
        `;

        overlayBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            // 移除 wrapper，恢复原状
            if (parentLink) {
                wrapper.parentNode.insertBefore(parentLink, wrapper);
            } else {
                wrapper.parentNode.insertBefore(img, wrapper);
            }
            wrapper.remove();

            // 重置标记，允许重新初始化
            img.dataset.gifControlled = 'loading';

            // 使用完整加载模式
            const controller = new GifController(img);
            await controller.init();

            img.dataset.gifControlled = 'true';
        }, true);

        wrapper.appendChild(overlayBtn);
    }

    // ==================== 自动加载模式 ====================

    // 初始化单个图片 - 直接加载播放器
    async function initAutoGif(img) {
        if (img.dataset.gifControlled) {
            return;
        }

        // 确保图片已加载
        if (!img.complete || img.naturalWidth === 0) {
            img.addEventListener('load', () => {
                initAutoGif(img);
            }, { once: true });
            return;
        }

        // 检查尺寸
        if (!meetsMinSize(img)) {
            log('  ⏭️ 跳过小尺寸 GIF:', img.src, `(${img.naturalWidth}x${img.naturalHeight})`);
            return;
        }

        log('  ✅ 正在处理 GIF 图片:', img.src);

        img.dataset.gifControlled = 'true';

        // 检查是否被链接包裹，阻止链接跳转
        const parentLink = img.closest('a');
        if (parentLink) {
            parentLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }, true);
        }

        // 直接初始化控制器并自动播放
        const controller = new GifController(img);
        await controller.init();
    }

    // ==================== 主初始化逻辑 ====================

    function initGifControls() {
        // 如果配置还没加载完成，标记为待处理
        if (!configLoaded) {
            log('⏳ 配置尚未加载，等待中...');
            initPending = true;
            return;
        }

        // 检查是否被禁用
        if (pageTemporaryDisabled) {
            log('⏸️ 页面已临时禁用');
            return;
        }
        if (isDomainDisabled()) {
            log('🚫 当前域名已被禁用:', getCurrentDomain());
            return;
        }

        log('🔍 开始查找 GIF 图片...');
        log('📦 当前配置:', config);

        // 收集所有 GIF/WebP 图片
        // 使用 async 处理以支持 WebP 检测
        const processImages = async () => {
            const candidates = [];
            const imgElements = document.querySelectorAll('img');

            for (const img of imgElements) {
                if (isTargetImage(img) && !img.dataset.gifControlled) {
                    // 如果是 WebP，需要检测是否为动图
                    if (isWebP(img.src)) {
                        const animated = await isAnimatedWebP(img.src);
                        if (animated) {
                            candidates.push(img);
                            log(`  ✓ 匹配到 WebP 动图: ${img.src}`);
                        } else {
                            // log(`  ⏭️ 跳过静态 WebP: ${img.src}`);
                        }
                    } else {
                        // GIF 默认认为是动图
                        candidates.push(img);
                        log(`  ✓ 匹配到 GIF: ${img.src}`);
                    }
                }
            }
            return candidates;
        };

        processImages().then(allGifs => {
            log(`📊 找到 ${allGifs.length} 个目标图片`);

            if (allGifs.length === 0) {
                return;
            }

            // 过滤出满足尺寸条件的 GIF（需要等待图片加载）
            const eligibleGifs = allGifs.filter(img => {
                // 如果图片已加载，检查尺寸
                if (img.complete && img.naturalWidth > 0) {
                    return meetsMinSize(img);
                }
                // 未加载的图片先认为符合条件，后续会再次检查
                return true;
            });

            log(`📏 满足尺寸条件的图片: ${eligibleGifs.length} 个`);

            // 决定加载策略
            let shouldAutoLoad = config.autoLoadEnabled && eligibleGifs.length <= config.maxAutoLoadCount;

            if (!config.autoLoadEnabled) {
                log('⚙️ 自动加载已关闭，使用手动模式');
            } else if (eligibleGifs.length > config.maxAutoLoadCount) {
                log(`⚠️ 图片数量超过 ${config.maxAutoLoadCount} 个，使用手动模式`);
            }

            // 逐个初始化
            eligibleGifs.forEach((img, index) => {
                setTimeout(() => {
                    if (shouldAutoLoad) {
                        initAutoGif(img);
                    } else {
                        initManualGif(img);
                    }
                }, index * 100);
            });
        });
    }

    // ==================== DOM 监听 ====================

    // 监听 DOM 变化
    const observer = new MutationObserver((mutations) => {
        let hasNewImages = false;
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeName === 'IMG' && isTargetImage(node)) {
                    hasNewImages = true;
                    break;
                }
                if (node.querySelectorAll) {
                    const imgs = node.querySelectorAll('img');
                    for (const img of imgs) {
                        if (isTargetImage(img)) {
                            hasNewImages = true;
                            break;
                        }
                    }
                }
            }
            if (hasNewImages) break;
        }
        if (hasNewImages) {
            log('🔄 检测到新图片，重新扫描...');
            initGifControls();
        }
    });

    // 延迟初始化函数
    function delayedInit() {
        initGifControls();
    }

    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initGifControls();
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(delayedInit, 1000);
            setTimeout(delayedInit, 3000);
        });
    } else {
        initGifControls();
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(delayedInit, 1000);
        setTimeout(delayedInit, 3000);
    }

    log('🎬 GIF 播放控制器已加载 (v4.0)');
})();
