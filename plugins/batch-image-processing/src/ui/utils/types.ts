// 图片处理类型定义

// 支持的图片格式
export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp' | 'tiff' | 'avif' | 'bmp' | 'gif' | 'ico'

// 处理功能类型
export type ProcessType =
    | 'compress'      // 压缩
    | 'watermark'     // 水印
    | 'convert'       // 格式转换
    | 'resize'        // 调整尺寸
    | 'crop'          // 裁剪
    | 'rotate'        // 旋转
    | 'flip'          // 翻转
    | 'border'        // 边框
    | 'corner'        // 圆角
    | 'merge-pdf'     // 合并 PDF
    | 'merge-image'   // 合并图片
    | 'merge-gif'     // 合成 GIF

// 图片信息
export interface ImageInfo {
    path: string
    name: string
    size: number
    width?: number
    height?: number
    format?: string
}

// 处理结果
export interface ProcessResult {
    success: boolean
    sourcePath: string
    outputPath?: string
    error?: string
}

// 水印配置
export interface WatermarkOptions {
    type: 'text' | 'image'
    // 文字水印
    text?: string
    fontSize?: number
    fontColor?: string
    // 图片水印
    imagePath?: string
    // 通用配置
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    opacity: number         // 0-100
    rotation: number        // 角度
    tiled: boolean          // 是否平铺
    margin: number          // 边距
}

// 尺寸调整配置
export interface ResizeOptions {
    mode: 'fixed' | 'percent'
    width?: number
    height?: number
    percent?: number
    keepAspectRatio: boolean
}

// 裁剪配置
export interface CropOptions {
    mode: 'ratio' | 'custom'
    ratio?: string           // 如 "16:9"、"4:3"、"1:1"
    left?: number
    top?: number
    width?: number
    height?: number
}

// 边框配置
export interface BorderOptions {
    width: number
    color: string
    opacity: number
}

// 圆角配置
export interface CornerOptions {
    mode: 'pixel' | 'percent'
    radius: number           // 像素值或百分比
}

// 合并 PDF 配置
export interface MergePdfOptions {
    fit: 'contain' | 'fill' // 适应页面方式
}

// 合并图片配置
export interface MergeImageOptions {
    direction: 'vertical' | 'horizontal'
    margin: number
    color: string // 背景色
}

// 合成 GIF 配置
export interface MergeGifOptions {
    delay: number // 每帧延迟(ms)
    loop: number  // 循环次数 (0无限)
}

// 处理进度
export interface ProcessProgress {
    total: number
    current: number
    currentFile: string
    status: 'processing' | 'completed' | 'error'
}

// 功能配置项
export interface ProcessConfig {
    type: ProcessType
    quality?: number                   // 压缩质量
    format?: ImageFormat               // 目标格式
    watermark?: WatermarkOptions       // 水印配置
    resize?: ResizeOptions             // 尺寸配置
    crop?: CropOptions                 // 裁剪配置
    rotate?: number                    // 旋转角度
    flip?: 'vertical' | 'horizontal'   // 翻转方向
    border?: BorderOptions             // 边框配置
    corner?: CornerOptions             // 圆角配置
    mergePdf?: MergePdfOptions         // PDF 配置
    mergeImage?: MergeImageOptions     // 合并图片配置
    mergeGif?: MergeGifOptions         // GIF 配置
    outputDir?: string                 // 输出目录
}
