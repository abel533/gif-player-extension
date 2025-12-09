(function (global) {
    'use strict';

    // LZW 解码 - 改进版
    function lzwDecode(minCodeSize, data, pixelCount) {
        const MAX_STACK_SIZE = 4096;
        const nullCode = -1;
        const pixels = new Uint8Array(pixelCount);
        const prefix = new Int32Array(MAX_STACK_SIZE);
        const suffix = new Uint8Array(MAX_STACK_SIZE);
        const stack = new Uint8Array(MAX_STACK_SIZE);

        const clearCode = 1 << minCodeSize;
        const endCode = clearCode + 1;
        let codeSize = minCodeSize + 1;
        let codeMask = (1 << codeSize) - 1;
        let nextCode = clearCode + 2;

        for (let code = 0; code < clearCode; code++) {
            prefix[code] = 0;
            suffix[code] = code;
        }

        let datum = 0;
        let bits = 0;
        let first = 0;
        let top = 0;
        let pi = 0;
        let bi = 0;
        let oldCode = nullCode;

        while (pi < pixelCount) {
            // 读取更多位
            while (bits < codeSize) {
                if (bi >= data.length) break;
                datum |= data[bi++] << bits;
                bits += 8;
            }

            if (bits < codeSize) break;

            let code = datum & codeMask;
            datum >>= codeSize;
            bits -= codeSize;

            if (code === clearCode) {
                codeSize = minCodeSize + 1;
                codeMask = (1 << codeSize) - 1;
                nextCode = clearCode + 2;
                oldCode = nullCode;
                continue;
            }

            if (code === endCode) break;

            if (oldCode === nullCode) {
                pixels[pi++] = suffix[code];
                oldCode = code;
                first = code;
                continue;
            }

            let inCode = code;
            if (code >= nextCode) {
                stack[top++] = first;
                code = oldCode;
            }

            while (code >= clearCode) {
                if (top >= MAX_STACK_SIZE) break;
                stack[top++] = suffix[code];
                code = prefix[code];
            }

            first = suffix[code];
            pixels[pi++] = first;

            while (top > 0 && pi < pixelCount) {
                pixels[pi++] = stack[--top];
            }

            if (nextCode < MAX_STACK_SIZE) {
                prefix[nextCode] = oldCode;
                suffix[nextCode] = first;
                nextCode++;
                if (nextCode === codeMask + 1 && nextCode < MAX_STACK_SIZE) {
                    codeSize++;
                    codeMask = (1 << codeSize) - 1;
                }
            }

            oldCode = inCode;
        }

        return pixels;
    }

    // 解析 GIF
    function parseGIF(arrayBuffer) {
        const bytes = new Uint8Array(arrayBuffer);
        let pos = 0;

        const readByte = () => bytes[pos++];
        const readBytes = (n) => {
            const result = bytes.slice(pos, pos + n);
            pos += n;
            return result;
        };

        // Header
        const header = String.fromCharCode(...readBytes(6));
        if (!header.startsWith('GIF')) {
            throw new Error('Invalid GIF');
        }

        // Logical Screen Descriptor
        const width = readByte() | (readByte() << 8);
        const height = readByte() | (readByte() << 8);
        const packed = readByte();
        const bgColorIndex = readByte();
        readByte(); // aspect ratio

        let globalColorTable = null;
        if (packed & 0x80) {
            const size = 2 << (packed & 0x07);
            globalColorTable = [];
            for (let i = 0; i < size; i++) {
                globalColorTable.push([readByte(), readByte(), readByte()]);
            }
        }

        const frames = [];
        let graphicControl = null;

        while (pos < bytes.length) {
            const blockType = readByte();

            if (blockType === 0x21) { // Extension
                const label = readByte();

                if (label === 0xF9) { // Graphic Control Extension
                    readByte(); // block size (always 4)
                    const gcPacked = readByte();
                    const delay = (readByte() | (readByte() << 8)) * 10;
                    const transparentIndex = readByte();
                    readByte(); // terminator

                    graphicControl = {
                        delay: delay || 100,
                        transparentIndex: (gcPacked & 0x01) ? transparentIndex : null,
                        disposalType: (gcPacked >> 2) & 0x07
                    };
                } else {
                    // Skip other extensions
                    let blockSize = readByte();
                    while (blockSize > 0) {
                        pos += blockSize;
                        blockSize = readByte();
                    }
                }
            } else if (blockType === 0x2C) { // Image Descriptor
                const left = readByte() | (readByte() << 8);
                const top = readByte() | (readByte() << 8);
                const imgWidth = readByte() | (readByte() << 8);
                const imgHeight = readByte() | (readByte() << 8);
                const imgPacked = readByte();
                const interlaced = !!(imgPacked & 0x40);

                let localColorTable = null;
                if (imgPacked & 0x80) {
                    const size = 2 << (imgPacked & 0x07);
                    localColorTable = [];
                    for (let i = 0; i < size; i++) {
                        localColorTable.push([readByte(), readByte(), readByte()]);
                    }
                }

                const minCodeSize = readByte();
                const imageData = [];
                let blockSize = readByte();
                while (blockSize > 0) {
                    for (let i = 0; i < blockSize; i++) {
                        imageData.push(readByte());
                    }
                    blockSize = readByte();
                }

                frames.push({
                    left,
                    top,
                    width: imgWidth,
                    height: imgHeight,
                    colorTable: localColorTable || globalColorTable,
                    minCodeSize,
                    data: new Uint8Array(imageData),
                    delay: graphicControl?.delay || 100,
                    disposalType: graphicControl?.disposalType || 0,
                    transparentIndex: graphicControl?.transparentIndex,
                    interlaced
                });

                graphicControl = null;
            } else if (blockType === 0x3B) { // Trailer
                break;
            } else if (blockType === 0x00) {
                // Skip null bytes
                continue;
            }
        }

        return { width, height, frames };
    }

    // 解交错
    function deinterlace(pixels, width, height) {
        const result = new Uint8Array(pixels.length);
        const passes = [
            { start: 0, step: 8 },
            { start: 4, step: 8 },
            { start: 2, step: 4 },
            { start: 1, step: 2 }
        ];

        let srcRow = 0;
        for (const pass of passes) {
            for (let y = pass.start; y < height; y += pass.step) {
                const srcOffset = srcRow * width;
                const destOffset = y * width;
                for (let x = 0; x < width; x++) {
                    result[destOffset + x] = pixels[srcOffset + x];
                }
                srcRow++;
            }
        }

        return result;
    }

    // 解压帧
    function decompressFrames(gif, buildPatch = true) {
        const { width, height, frames } = gif;
        const decompressedFrames = [];

        for (const frame of frames) {
            const pixelCount = frame.width * frame.height;
            let pixels = lzwDecode(frame.minCodeSize, frame.data, pixelCount);

            // 处理交错
            if (frame.interlaced) {
                pixels = deinterlace(pixels, frame.width, frame.height);
            }

            const result = {
                delay: frame.delay,
                disposalType: frame.disposalType,
                dims: {
                    width: frame.width,
                    height: frame.height,
                    left: frame.left,
                    top: frame.top
                }
            };

            if (buildPatch) {
                const patch = new Uint8ClampedArray(pixelCount * 4);
                for (let i = 0; i < pixelCount; i++) {
                    const colorIndex = pixels[i];
                    const color = frame.colorTable[colorIndex] || [0, 0, 0];
                    const pos = i * 4;

                    patch[pos] = color[0];
                    patch[pos + 1] = color[1];
                    patch[pos + 2] = color[2];
                    patch[pos + 3] = colorIndex !== frame.transparentIndex ? 255 : 0;
                }
                result.patch = patch;
            }

            decompressedFrames.push(result);
        }

        return decompressedFrames;
    }

    global.gifuct = {
        parseGIF,
        decompressFrames
    };

})(window);