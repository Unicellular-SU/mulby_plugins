/**
 * 图片处理核心工具
 * 封装 Mulby Sharp API 调用
 */

import type {
    ImageInfo,
    ProcessResult,
    ProcessConfig,
    WatermarkOptions,
    ResizeOptions,
    CropOptions,
    BorderOptions,
    CornerOptions,
    ImageFormat,
    MergePdfOptions,
    MergeImageOptions,
    MergeGifOptions
} from './types'

// 获取 sharp 实例
const getSharp = () => window.mulby.sharp

/**
 * 获取图片元数据
 */
export async function getImageInfo(filePath: string): Promise<ImageInfo> {
    const sharp = getSharp()
    const metadata = await sharp(filePath).metadata()
    const name = filePath.split('/').pop() || filePath.split('\\').pop() || filePath

    return {
        path: filePath,
        name,
        size: 0,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
    }
}

/**
 * 生成输出路径
 */
function generateOutputPath(
    sourcePath: string,
    suffix: string,
    newFormat?: string,
    outputDir?: string
): string {
    const parts = sourcePath.split('/')
    const fileName = parts.pop() || ''
    const dir = outputDir || parts.join('/')
    const dotIndex = fileName.lastIndexOf('.')
    const baseName = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName
    const ext = newFormat || (dotIndex > 0 ? fileName.substring(dotIndex + 1) : 'png')

    return `${dir}/${baseName}_${suffix}.${ext}`
}

/**
 * 批量压缩图片
 */
export async function compress(
    files: string[],
    quality: number,
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []

    for (const file of files) {
        try {
            const metadata = await sharp(file).metadata()
            const format = metadata.format || 'jpeg'
            const outputPath = generateOutputPath(file, 'compressed', format, outputDir)

            let instance = sharp(file)

            // 根据格式设置压缩质量
            if (format === 'jpeg' || format === 'jpg') {
                instance = instance.jpeg({ quality })
            } else if (format === 'png') {
                instance = instance.png({ quality, compressionLevel: 9 })
            } else if (format === 'webp') {
                instance = instance.webp({ quality })
            } else if (format === 'avif') {
                instance = instance.avif({ quality })
            } else if (format === 'tiff') {
                instance = instance.tiff({ quality })
            }

            await instance.toFile(outputPath)
            results.push({ success: true, sourcePath: file, outputPath })
        } catch (error) {
            results.push({
                success: false,
                sourcePath: file,
                error: error instanceof Error ? error.message : '压缩失败'
            })
        }
    }

    return results
}

/**
 * 添加水印
 */
export async function addWatermark(
    files: string[],
    options: WatermarkOptions,
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []

    for (const file of files) {
        try {
            const metadata = await sharp(file).metadata()
            const imgWidth = metadata.width || 800
            const imgHeight = metadata.height || 600
            const format = metadata.format || 'png'
            const outputPath = generateOutputPath(file, 'watermarked', format, outputDir)

            let watermarkBuffer: ArrayBuffer
            let wmWidth: number
            let wmHeight: number

            if (options.type === 'text' && options.text) {
                // 文字水印：创建 SVG
                const fontSize = options.fontSize || 24
                const fontColor = options.fontColor || '#ffffff'
                const opacity = options.opacity || 50
                const rotation = options.rotation || 0

                // 计算文字尺寸（近似）
                const textWidth = options.text.length * fontSize * 0.7
                const textHeight = fontSize * 1.5

                // 计算旋转后的边界框尺寸
                const radians = Math.abs(rotation) * Math.PI / 180
                const cos = Math.cos(radians)
                const sin = Math.sin(radians)
                // 旋转后的边界框 = |w*cos| + |h*sin| 和 |w*sin| + |h*cos|
                const rotatedWidth = Math.abs(textWidth * cos) + Math.abs(textHeight * sin)
                const rotatedHeight = Math.abs(textWidth * sin) + Math.abs(textHeight * cos)

                // SVG 尺寸要足够大以容纳旋转后的文字
                wmWidth = Math.ceil(rotatedWidth + 60)
                wmHeight = Math.ceil(rotatedHeight + 40)

                // 创建带透明背景的 SVG
                const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${wmWidth}" height="${wmHeight}" xmlns="http://www.w3.org/2000/svg">
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif"
    font-size="${fontSize}"
    fill="${fontColor}"
    fill-opacity="${opacity / 100}"
    text-anchor="middle"
    dominant-baseline="middle"
    transform="rotate(${rotation}, ${wmWidth / 2}, ${wmHeight / 2})"
  >${options.text}</text>
</svg>`

                // 使用 TextEncoder 转换 SVG
                const encoder = new TextEncoder()
                const svgData = encoder.encode(svg)
                watermarkBuffer = await sharp(svgData).png().toBuffer()
            } else if (options.type === 'image' && options.imagePath) {
                // 图片水印
                const wmMeta = await sharp(options.imagePath).metadata()
                wmWidth = wmMeta.width || 100
                wmHeight = wmMeta.height || 100
                watermarkBuffer = await sharp(options.imagePath).png().toBuffer()
            } else {
                throw new Error('无效的水印配置')
            }

            // 计算水印位置
            const margin = options.margin || 10
            let left = margin
            let top = margin

            switch (options.position) {
                case 'top-right':
                    left = imgWidth - wmWidth - margin
                    break
                case 'bottom-left':
                    top = imgHeight - wmHeight - margin
                    break
                case 'bottom-right':
                    left = imgWidth - wmWidth - margin
                    top = imgHeight - wmHeight - margin
                    break
                case 'center':
                    left = Math.floor((imgWidth - wmWidth) / 2)
                    top = Math.floor((imgHeight - wmHeight) / 2)
                    break
            }

            // 确保位置不为负数
            left = Math.max(0, left)
            top = Math.max(0, top)

            const compositeImages: { input: ArrayBuffer; left: number; top: number }[] = []

            if (options.tiled) {
                // 平铺水印
                const spacingX = wmWidth + 80
                const spacingY = wmHeight + 80
                for (let y = 0; y < imgHeight; y += spacingY) {
                    for (let x = 0; x < imgWidth; x += spacingX) {
                        compositeImages.push({ input: watermarkBuffer, left: x, top: y })
                    }
                }
            } else {
                compositeImages.push({ input: watermarkBuffer, left, top })
            }

            await sharp(file)
                .composite(compositeImages)
                .toFile(outputPath)

            results.push({ success: true, sourcePath: file, outputPath })
        } catch (error) {
            results.push({
                success: false,
                sourcePath: file,
                error: error instanceof Error ? error.message : '添加水印失败'
            })
        }
    }

    return results
}

/**
 * 格式转换
 */
export async function convertFormat(
    files: string[],
    targetFormat: ImageFormat,
    quality: number = 90,
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []

    for (const file of files) {
        try {
            const outputPath = generateOutputPath(file, 'converted', targetFormat, outputDir)
            let instance = sharp(file)

            // 根据目标格式设置选项
            switch (targetFormat) {
                case 'png':
                    instance = instance.png({ quality })
                    break
                case 'jpg':
                case 'jpeg':
                    instance = instance.jpeg({ quality })
                    break
                case 'webp':
                    instance = instance.webp({ quality })
                    break
                case 'tiff':
                    instance = instance.tiff({ quality })
                    break
                case 'avif':
                    instance = instance.avif({ quality })
                    break
                case 'gif':
                    instance = instance.gif()
                    break
                default:
                    instance = instance.png()
            }

            await instance.toFile(outputPath)
            results.push({ success: true, sourcePath: file, outputPath })
        } catch (error) {
            results.push({
                success: false,
                sourcePath: file,
                error: error instanceof Error ? error.message : '格式转换失败'
            })
        }
    }

    return results
}

/**
 * 调整尺寸
 */
export async function resize(
    files: string[],
    options: ResizeOptions,
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []

    for (const file of files) {
        try {
            const metadata = await sharp(file).metadata()
            const format = metadata.format || 'png'
            const outputPath = generateOutputPath(file, 'resized', format, outputDir)

            let width: number | undefined
            let height: number | undefined

            if (options.mode === 'percent' && options.percent) {
                width = Math.round((metadata.width || 100) * options.percent / 100)
                height = Math.round((metadata.height || 100) * options.percent / 100)
            } else {
                width = options.width
                height = options.height
            }

            await sharp(file)
                .resize(width, height, {
                    fit: options.keepAspectRatio ? 'inside' : 'fill',
                    withoutEnlargement: true
                })
                .toFile(outputPath)

            results.push({ success: true, sourcePath: file, outputPath })
        } catch (error) {
            results.push({
                success: false,
                sourcePath: file,
                error: error instanceof Error ? error.message : '调整尺寸失败'
            })
        }
    }

    return results
}

/**
 * 裁剪图片
 */
export async function crop(
    files: string[],
    options: CropOptions,
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []

    for (const file of files) {
        try {
            const metadata = await sharp(file).metadata()
            const imgWidth = metadata.width || 100
            const imgHeight = metadata.height || 100
            const format = metadata.format || 'png'
            const outputPath = generateOutputPath(file, 'cropped', format, outputDir)

            let left = 0, top = 0, width = imgWidth, height = imgHeight

            if (options.mode === 'ratio' && options.ratio) {
                const [ratioW, ratioH] = options.ratio.split(':').map(Number)
                const targetRatio = ratioW / ratioH
                const currentRatio = imgWidth / imgHeight

                if (currentRatio > targetRatio) {
                    // 图片太宽，裁剪宽度
                    width = Math.round(imgHeight * targetRatio)
                    left = Math.round((imgWidth - width) / 2)
                } else {
                    // 图片太高，裁剪高度
                    height = Math.round(imgWidth / targetRatio)
                    top = Math.round((imgHeight - height) / 2)
                }
            } else if (options.mode === 'custom') {
                left = options.left || 0
                top = options.top || 0
                width = options.width || imgWidth
                height = options.height || imgHeight
            }

            await sharp(file)
                .extract({ left, top, width, height })
                .toFile(outputPath)

            results.push({ success: true, sourcePath: file, outputPath })
        } catch (error) {
            results.push({
                success: false,
                sourcePath: file,
                error: error instanceof Error ? error.message : '裁剪失败'
            })
        }
    }

    return results
}

/**
 * 旋转图片
 */
export async function rotate(
    files: string[],
    angle: number,
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []

    for (const file of files) {
        try {
            const metadata = await sharp(file).metadata()
            const format = metadata.format || 'png'
            const outputPath = generateOutputPath(file, 'rotated', format, outputDir)

            await sharp(file)
                .rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
                .toFile(outputPath)

            results.push({ success: true, sourcePath: file, outputPath })
        } catch (error) {
            results.push({
                success: false,
                sourcePath: file,
                error: error instanceof Error ? error.message : '旋转失败'
            })
        }
    }

    return results
}

/**
 * 翻转图片
 */
export async function flip(
    files: string[],
    direction: 'vertical' | 'horizontal',
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []

    for (const file of files) {
        try {
            const metadata = await sharp(file).metadata()
            const format = metadata.format || 'png'
            const outputPath = generateOutputPath(file, 'flipped', format, outputDir)

            let instance = sharp(file)
            if (direction === 'vertical') {
                instance = instance.flip()
            } else {
                instance = instance.flop()
            }

            await instance.toFile(outputPath)
            results.push({ success: true, sourcePath: file, outputPath })
        } catch (error) {
            results.push({
                success: false,
                sourcePath: file,
                error: error instanceof Error ? error.message : '翻转失败'
            })
        }
    }

    return results
}

/**
 * 添加边框
 */
export async function addBorder(
    files: string[],
    options: BorderOptions,
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []

    // 解析颜色
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 }
    }

    for (const file of files) {
        try {
            const metadata = await sharp(file).metadata()
            const format = metadata.format || 'png'
            const outputPath = generateOutputPath(file, 'bordered', format, outputDir)

            const rgb = hexToRgb(options.color)
            const alpha = (options.opacity || 100) / 100

            await sharp(file)
                .extend({
                    top: options.width,
                    bottom: options.width,
                    left: options.width,
                    right: options.width,
                    background: { r: rgb.r, g: rgb.g, b: rgb.b, alpha }
                })
                .toFile(outputPath)

            results.push({ success: true, sourcePath: file, outputPath })
        } catch (error) {
            results.push({
                success: false,
                sourcePath: file,
                error: error instanceof Error ? error.message : '添加边框失败'
            })
        }
    }

    return results
}

/**
 * 设置圆角
 */
export async function setRoundCorner(
    files: string[],
    options: CornerOptions,
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []

    for (const file of files) {
        try {
            const metadata = await sharp(file).metadata()
            const imgWidth = metadata.width || 100
            const imgHeight = metadata.height || 100
            const outputPath = generateOutputPath(file, 'rounded', 'png', outputDir) // 圆角需要透明通道，使用 PNG

            // 计算圆角半径
            let radius = options.radius
            if (options.mode === 'percent') {
                const minSide = Math.min(imgWidth, imgHeight)
                radius = Math.round(minSide * options.radius / 100)
            }

            // 创建圆角蒙版 SVG
            const roundedCornersSvg = `
        <svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="${imgWidth}" height="${imgHeight}" rx="${radius}" ry="${radius}" fill="white"/>
        </svg>
      `

            // 使用 TextEncoder 替代 Buffer（浏览器环境）
            const encoder = new TextEncoder()
            const svgData = encoder.encode(roundedCornersSvg)
            const maskBuffer = await sharp(svgData)
                .png()
                .toBuffer()

            // 应用蒙版
            await sharp(file)
                .resize(imgWidth, imgHeight)
                .composite([{
                    input: maskBuffer,
                    blend: 'dest-in'
                }])
                .png()
                .toFile(outputPath)

            results.push({ success: true, sourcePath: file, outputPath })
        } catch (error) {
            results.push({
                success: false,
                sourcePath: file,
                error: error instanceof Error ? error.message : '设置圆角失败'
            })
        }
    }

    return results
}

/**
 * 统一处理入口
 */
import { jsPDF } from 'jspdf'

// ... (existing imports)

/**
 * 合并为 PDF
 */
export async function mergeToPdf(
    files: string[],
    options: MergePdfOptions,
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []

    try {
        const firstFile = files[0]
        const outputPath = generateOutputPath(firstFile, 'merged', 'pdf', outputDir)

        const pdf = new jsPDF()

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const metadata = await sharp(file).metadata()
            const imgWidth = metadata.width || 0
            const imgHeight = metadata.height || 0

            // 转换图片为 JPEG 数据 (jsPDF 支持较好)
            const buffer = await sharp(file).jpeg({ quality: 90 }).toBuffer()
            const uint8Array = new Uint8Array(buffer)

            if (i > 0) pdf.addPage()

            const pageWidth = pdf.internal.pageSize.getWidth()
            const pageHeight = pdf.internal.pageSize.getHeight()

            let drawWidth = pageWidth
            let drawHeight = (imgHeight * pageWidth) / imgWidth

            if (options.fit === 'contain') {
                // 适应页面
                if (drawHeight > pageHeight) {
                    drawHeight = pageHeight
                    drawWidth = (imgWidth * pageHeight) / imgHeight
                }
            }

            const x = (pageWidth - drawWidth) / 2
            const y = (pageHeight - drawHeight) / 2

            pdf.addImage(uint8Array, 'JPEG', x, y, drawWidth, drawHeight)
        }

        // 保存 PDF requires ArrayBuffer for Node filesystem writes usually, but jsPDF output is string/blob
        // In browser (UI), we can generate ArrayBuffer
        const pdfData = pdf.output('arraybuffer')
        // 既然宿主已支持 ArrayBuffer，我们可以直接传递。类型定义可能未更新，所以使用 as any
        await window.mulby.filesystem.writeFile(outputPath, pdfData as any)

        results.push({ success: true, sourcePath: firstFile, outputPath })

    } catch (error) {
        results.push({
            success: false,
            sourcePath: files[0] || 'Merge',
            error: error instanceof Error ? error.message : '合并 PDF 失败'
        })
    }

    return results
}

/**
 * 合并图片 (拼图)
 */
export async function mergeImages(
    files: string[],
    options: MergeImageOptions,
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []

    try {
        const firstFile = files[0]
        const outputPath = generateOutputPath(firstFile, 'merged', 'png', outputDir)

        // 获取所有图片信息
        const metas = await Promise.all(files.map(f => sharp(f).metadata()))

        let totalWidth = 0
        let totalHeight = 0
        const items: { input: string, top: number, left: number }[] = []

        let currentX = 0
        let currentY = 0

        if (options.direction === 'vertical') {
            // 垂直拼接
            // 计算最大宽度和总高度
            totalWidth = Math.max(...metas.map(m => m.width || 0))
            totalHeight = metas.reduce((sum, m) => sum + (m.height || 0), 0) + (files.length - 1) * options.margin

            for (let i = 0; i < files.length; i++) {
                const meta = metas[i]
                // 居中放置
                const left = Math.floor((totalWidth - (meta.width || 0)) / 2)
                items.push({ input: files[i], top: currentY, left })
                currentY += (meta.height || 0) + options.margin
            }
        } else {
            // 水平拼接
            totalHeight = Math.max(...metas.map(m => m.height || 0))
            totalWidth = metas.reduce((sum, m) => sum + (m.width || 0), 0) + (files.length - 1) * options.margin

            for (let i = 0; i < files.length; i++) {
                const meta = metas[i]
                const top = Math.floor((totalHeight - (meta.height || 0)) / 2)
                items.push({ input: files[i], top, left: currentX })
                currentX += (meta.width || 0) + options.margin
            }
        }

        // 创建背景
        const r = parseInt(options.color.slice(1, 3), 16)
        const g = parseInt(options.color.slice(3, 5), 16)
        const b = parseInt(options.color.slice(5, 7), 16)

        // 注意：sharp create 语法可能需要验证，这里假设 standard sharp api
        await sharp({
            create: {
                width: totalWidth,
                height: totalHeight,
                channels: 3,
                background: { r, g, b }
            }
        })
            .composite(items)
            .png()
            .toFile(outputPath)

        results.push({ success: true, sourcePath: firstFile, outputPath })

    } catch (error) {
        results.push({
            success: false,
            sourcePath: files[0] || 'Merge',
            error: error instanceof Error ? error.message : '合并图片失败'
        })
    }

    return results
}

/**
 * 合成 GIF
 */
export async function mergeToGif(
    files: string[],
    options: MergeGifOptions,
    outputDir?: string
): Promise<ProcessResult[]> {
    const sharp = getSharp()
    const results: ProcessResult[] = []
    let framesDir = ''

    try {
        const firstFile = files[0]
        const outputPath = generateOutputPath(firstFile, 'animation', 'gif', outputDir)

        // 1. 确定画布大小 (使用第一张图的尺寸，或者扫描所有图片取最大值)
        // 为了体验更好，取第一张图的尺寸作为基准，或者取最大值。
        // 为了稳妥，这里先扫描所有图片获取最大宽高
        const metas = await Promise.all(files.map(f => sharp(f).metadata()))
        const maxWidth = Math.max(...metas.map(m => m.width || 0))
        const maxHeight = Math.max(...metas.map(m => m.height || 0))

        // 2. 预处理图片：标准化尺寸和格式
        const tempPath = await window.mulby.system.getPath('temp')
        framesDir = `${tempPath}/gif_frames_${Date.now()}`
        await window.mulby.filesystem.mkdir(framesDir)

        // 并行处理所有帧
        await Promise.all(files.map(async (file, index) => {
            const frameName = `frame_${String(index).padStart(4, '0')}.png`
            const framePath = `${framesDir}/${frameName}`

            await sharp(file)
                .resize(maxWidth, maxHeight, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 } // 透明背景
                })
                .png()
                .toFile(framePath)
        }))

        // 3. 调用 ffmpeg
        // 计算帧率 (1000 / delay)
        const fps = Math.round(1000 / options.delay) || 1

        const args = [
            '-framerate', fps.toString(),
            '-i', `${framesDir}/frame_%04d.png`,
            '-vf', 'split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse', // 高质量 GIF 调色板
            '-loop', options.loop.toString(),
            '-y',
            outputPath
        ]

        await new Promise<void>((resolve, reject) => {
            const task = window.mulby.ffmpeg.run(args, () => {
                // optional progress
            })

            task.promise.then(() => resolve()).catch(reject)
        })

        results.push({ success: true, sourcePath: firstFile, outputPath })

    } catch (error) {
        results.push({
            success: false,
            sourcePath: files[0] || 'Merge',
            error: error instanceof Error ? error.message : '合成 GIF 失败'
        })
    } finally {
        // 清理临时帧目录
        if (framesDir) {
            try {
                await window.mulby.shell.trashItem(framesDir)
            } catch { }
        }
    }

    return results
}

/**
 * 统一处理入口
 */
export async function processImages(
    files: string[],
    config: ProcessConfig,
    onProgress?: (current: number, total: number, file: string) => void
): Promise<ProcessResult[]> {
    const results: ProcessResult[] = []

    // 处理合并类任务 (多对一)
    if (config.type === 'merge-pdf' || config.type === 'merge-image' || config.type === 'merge-gif') {
        onProgress?.(0, 1, '正在合并...')
        let result: ProcessResult[] = []

        switch (config.type) {
            case 'merge-pdf':
                if (!config.mergePdf) throw new Error('缺少 PDF 配置')
                result = await mergeToPdf(files, config.mergePdf, config.outputDir)
                break
            case 'merge-image':
                if (!config.mergeImage) throw new Error('缺少合并图片配置')
                result = await mergeImages(files, config.mergeImage, config.outputDir)
                break
            case 'merge-gif':
                if (!config.mergeGif) throw new Error('缺少 GIF 配置')
                result = await mergeToGif(files, config.mergeGif, config.outputDir)
                break
        }
        onProgress?.(1, 1, '合并完成')
        return result
    }

    // 处理普通任务 (一对一)
    for (let i = 0; i < files.length; i++) {
        const file = files[i]
        onProgress?.(i + 1, files.length, file)

        let result: ProcessResult[]

        try {
            switch (config.type) {
                case 'compress':
                    result = await compress([file], config.quality || 80, config.outputDir)
                    break
                case 'watermark':
                    if (!config.watermark) throw new Error('缺少水印配置')
                    result = await addWatermark([file], config.watermark, config.outputDir)
                    break
                case 'convert':
                    if (!config.format) throw new Error('缺少目标格式')
                    result = await convertFormat([file], config.format, config.quality || 90, config.outputDir)
                    break
                case 'resize':
                    if (!config.resize) throw new Error('缺少尺寸配置')
                    result = await resize([file], config.resize, config.outputDir)
                    break
                case 'crop':
                    if (!config.crop) throw new Error('缺少裁剪配置')
                    result = await crop([file], config.crop, config.outputDir)
                    break
                case 'rotate':
                    result = await rotate([file], config.rotate || 90, config.outputDir)
                    break
                case 'flip':
                    result = await flip([file], config.flip || 'vertical', config.outputDir) // Default fixed to match types
                    break
                case 'border':
                    if (!config.border) throw new Error('缺少边框配置')
                    result = await addBorder([file], config.border, config.outputDir)
                    break
                case 'corner':
                    if (!config.corner) throw new Error('缺少圆角配置')
                    result = await setRoundCorner([file], config.corner, config.outputDir)
                    break
                default:
                    throw new Error('未知的处理类型')
            }

            results.push(...result)
        } catch (error) {
            results.push({
                success: false,
                sourcePath: file,
                error: error instanceof Error ? error.message : '处理失败'
            })
        }
    }

    return results
}
