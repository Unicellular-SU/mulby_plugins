/**
 * 设置对话框组件
 * 根据不同功能类型显示对应的配置项
 */

import { useState, useEffect } from 'react'
import type {
    ProcessType,
    ProcessConfig,
    ImageFormat,
    WatermarkOptions
} from '../utils/types'

interface SettingsDialogProps {
    type: ProcessType
    onConfirm: (config: ProcessConfig) => void
    onCancel: () => void
}

// 支持的输出格式
const formats: ImageFormat[] = ['png', 'jpg', 'jpeg', 'webp', 'tiff', 'avif', 'bmp', 'gif', 'ico']

// 常用宽高比
const ratios = ['1:1', '4:3', '3:2', '16:9', '9:16', '3:4', '2:3']

// 水印位置
const positions = [
    { value: 'top-left', label: '左上' },
    { value: 'top-right', label: '右上' },
    { value: 'bottom-left', label: '左下' },
    { value: 'bottom-right', label: '右下' },
    { value: 'center', label: '居中' }
] as const

export function SettingsDialog({ type, onConfirm, onCancel }: SettingsDialogProps) {
    // 压缩配置
    const [quality, setQuality] = useState(80)

    // 格式转换
    const [targetFormat, setTargetFormat] = useState<ImageFormat>('webp')

    // 水印配置
    const [watermarkType, setWatermarkType] = useState<'text' | 'image'>('text')
    const [watermarkText, setWatermarkText] = useState('水印文字')
    const [fontSize, setFontSize] = useState(24)
    const [fontColor, setFontColor] = useState('#ffffff')
    const [watermarkImage, setWatermarkImage] = useState('')
    const [position, setPosition] = useState<WatermarkOptions['position']>('bottom-right')
    const [opacity, setOpacity] = useState(50)
    const [rotation, setRotation] = useState(0)
    const [tiled, setTiled] = useState(false)
    const [margin, setMargin] = useState(10)

    // 尺寸配置
    const [resizeMode, setResizeMode] = useState<'fixed' | 'percent'>('percent')
    const [resizeWidth, setResizeWidth] = useState(800)
    const [resizeHeight, setResizeHeight] = useState(600)
    const [resizePercent, setResizePercent] = useState(50)
    const [keepAspectRatio, setKeepAspectRatio] = useState(true)

    // 裁剪配置
    const [cropMode, setCropMode] = useState<'ratio' | 'custom'>('ratio')
    const [ratio, setRatio] = useState('16:9')

    // 旋转角度
    const [rotateAngle, setRotateAngle] = useState(90)

    // 翻转方向
    const [flipDirection, setFlipDirection] = useState<'vertical' | 'horizontal'>('horizontal')

    // 边框配置
    const [borderWidth, setBorderWidth] = useState(10)
    const [borderColor, setBorderColor] = useState('#ffffff')
    const [borderOpacity, setBorderOpacity] = useState(100)

    // 圆角配置
    const [cornerMode, setCornerMode] = useState<'pixel' | 'percent'>('percent')
    const [cornerRadius, setCornerRadius] = useState(10)

    // 合并 PDF 配置
    const [pdfFit, setPdfFit] = useState<'contain' | 'fill'>('contain')

    // 合并图片配置
    const [mergeDirection, setMergeDirection] = useState<'vertical' | 'horizontal'>('vertical')
    const [mergeMargin, setMergeMargin] = useState(0)
    const [mergeColor, setMergeColor] = useState('#ffffff')

    // 合成 GIF 配置
    const [gifDelay, setGifDelay] = useState(500)
    const [gifLoop, setGifLoop] = useState(0)

    // 选择水印图片
    const handleSelectWatermarkImage = async () => {
        const files = await window.mulby.dialog.showOpenDialog({
            title: '选择水印图片',
            properties: ['openFile'],
            filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp'] }]
        })
        if (files.length > 0) {
            setWatermarkImage(files[0])
        }
    }

    // 构建配置并确认
    const handleConfirm = () => {
        const config: ProcessConfig = { type }

        switch (type) {
            case 'compress':
                config.quality = quality
                break

            case 'watermark':
                config.watermark = {
                    type: watermarkType,
                    text: watermarkType === 'text' ? watermarkText : undefined,
                    fontSize,
                    fontColor,
                    imagePath: watermarkType === 'image' ? watermarkImage : undefined,
                    position,
                    opacity,
                    rotation,
                    tiled,
                    margin
                }
                break

            case 'convert':
                config.format = targetFormat
                config.quality = quality
                break

            case 'resize':
                config.resize = {
                    mode: resizeMode,
                    width: resizeMode === 'fixed' ? resizeWidth : undefined,
                    height: resizeMode === 'fixed' ? resizeHeight : undefined,
                    percent: resizeMode === 'percent' ? resizePercent : undefined,
                    keepAspectRatio
                }
                break

            case 'crop':
                config.crop = {
                    mode: cropMode,
                    ratio: cropMode === 'ratio' ? ratio : undefined
                }
                break

            case 'rotate':
                config.rotate = rotateAngle
                break

            case 'flip':
                config.flip = flipDirection
                break

            case 'border':
                config.border = {
                    width: borderWidth,
                    color: borderColor,
                    opacity: borderOpacity
                }
                break

            case 'corner':
                config.corner = {
                    mode: cornerMode,
                    radius: cornerRadius
                }
                break

            case 'merge-pdf':
                config.mergePdf = {
                    fit: pdfFit
                }
                break

            case 'merge-image':
                config.mergeImage = {
                    direction: mergeDirection,
                    margin: mergeMargin,
                    color: mergeColor
                }
                break

            case 'merge-gif':
                config.mergeGif = {
                    delay: gifDelay,
                    loop: gifLoop
                }
                break
        }

        onConfirm(config)
    }

    // 根据类型渲染对应的配置表单
    const renderSettings = () => {
        switch (type) {
            case 'compress':
                return (
                    <div className="settings-form">
                        <div className="form-group">
                            <label>压缩质量：{quality}%</label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={quality}
                                onChange={(e) => setQuality(Number(e.target.value))}
                            />
                            <span className="range-hint">质量越低，文件越小</span>
                        </div>
                    </div>
                )

            case 'watermark':
                return (
                    <div className="settings-form">
                        <div className="form-group">
                            <label>水印类型</label>
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        checked={watermarkType === 'text'}
                                        onChange={() => setWatermarkType('text')}
                                    />
                                    文字水印
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        checked={watermarkType === 'image'}
                                        onChange={() => setWatermarkType('image')}
                                    />
                                    图片水印
                                </label>
                            </div>
                        </div>

                        {watermarkType === 'text' ? (
                            <>
                                <div className="form-group">
                                    <label>水印文字</label>
                                    <input
                                        type="text"
                                        value={watermarkText}
                                        onChange={(e) => setWatermarkText(e.target.value)}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>字体大小</label>
                                        <input
                                            type="number"
                                            min="12"
                                            max="200"
                                            value={fontSize}
                                            onChange={(e) => setFontSize(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>颜色</label>
                                        <input
                                            type="color"
                                            value={fontColor}
                                            onChange={(e) => setFontColor(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="form-group">
                                <label>水印图片</label>
                                <div className="file-input">
                                    <input type="text" value={watermarkImage} readOnly />
                                    <button onClick={handleSelectWatermarkImage}>选择</button>
                                </div>
                            </div>
                        )}

                        <div className="form-row">
                            <div className="form-group">
                                <label>位置</label>
                                <select value={position} onChange={(e) => setPosition(e.target.value as WatermarkOptions['position'])}>
                                    {positions.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>透明度：{opacity}%</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={opacity}
                                    onChange={(e) => setOpacity(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>旋转角度：{rotation}°</label>
                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    value={rotation}
                                    onChange={(e) => setRotation(Number(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label>边距</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="200"
                                    value={margin}
                                    onChange={(e) => setMargin(Number(e.target.value))}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={tiled}
                                    onChange={(e) => setTiled(e.target.checked)}
                                />
                                平铺水印
                            </label>
                        </div>
                    </div>
                )

            case 'convert':
                return (
                    <div className="settings-form">
                        <div className="form-group">
                            <label>目标格式</label>
                            <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value as ImageFormat)}>
                                {formats.map(f => (
                                    <option key={f} value={f}>{f.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>输出质量：{quality}%</label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={quality}
                                onChange={(e) => setQuality(Number(e.target.value))}
                            />
                        </div>
                    </div>
                )

            case 'resize':
                return (
                    <div className="settings-form">
                        <div className="form-group">
                            <label>调整方式</label>
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        checked={resizeMode === 'percent'}
                                        onChange={() => setResizeMode('percent')}
                                    />
                                    按百分比
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        checked={resizeMode === 'fixed'}
                                        onChange={() => setResizeMode('fixed')}
                                    />
                                    固定尺寸
                                </label>
                            </div>
                        </div>

                        {resizeMode === 'percent' ? (
                            <div className="form-group">
                                <label>缩放比例：{resizePercent}%</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="200"
                                    value={resizePercent}
                                    onChange={(e) => setResizePercent(Number(e.target.value))}
                                />
                            </div>
                        ) : (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>宽度</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={resizeWidth}
                                        onChange={(e) => setResizeWidth(Number(e.target.value))}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>高度</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={resizeHeight}
                                        onChange={(e) => setResizeHeight(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={keepAspectRatio}
                                    onChange={(e) => setKeepAspectRatio(e.target.checked)}
                                />
                                保持宽高比
                            </label>
                        </div>
                    </div>
                )

            case 'crop':
                return (
                    <div className="settings-form">
                        <div className="form-group">
                            <label>裁剪方式</label>
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        checked={cropMode === 'ratio'}
                                        onChange={() => setCropMode('ratio')}
                                    />
                                    按比例
                                </label>
                            </div>
                        </div>

                        {cropMode === 'ratio' && (
                            <div className="form-group">
                                <label>宽高比</label>
                                <div className="ratio-grid">
                                    {ratios.map(r => (
                                        <button
                                            key={r}
                                            className={`ratio-btn ${ratio === r ? 'selected' : ''}`}
                                            onClick={() => setRatio(r)}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )

            case 'rotate':
                return (
                    <div className="settings-form">
                        <div className="form-group">
                            <label>旋转角度：{rotateAngle}°</label>
                            <input
                                type="range"
                                min="-180"
                                max="180"
                                step="1"
                                value={rotateAngle}
                                onChange={(e) => setRotateAngle(Number(e.target.value))}
                            />
                        </div>
                        <div className="quick-rotate">
                            <button onClick={() => setRotateAngle(90)}>90°</button>
                            <button onClick={() => setRotateAngle(180)}>180°</button>
                            <button onClick={() => setRotateAngle(-90)}>-90°</button>
                        </div>
                    </div>
                )

            case 'flip':
                return (
                    <div className="settings-form">
                        <div className="form-group">
                            <label>翻转方向</label>
                            <div className="flip-options">
                                <button
                                    className={`flip-btn ${flipDirection === 'horizontal' ? 'selected' : ''}`}
                                    onClick={() => setFlipDirection('horizontal')}
                                >
                                    ↔️ 水平翻转
                                </button>
                                <button
                                    className={`flip-btn ${flipDirection === 'vertical' ? 'selected' : ''}`}
                                    onClick={() => setFlipDirection('vertical')}
                                >
                                    ↕️ 垂直翻转
                                </button>
                            </div>
                        </div>
                    </div>
                )

            case 'border':
                return (
                    <div className="settings-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label>边框宽度</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="200"
                                    value={borderWidth}
                                    onChange={(e) => setBorderWidth(Number(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label>边框颜色</label>
                                <input
                                    type="color"
                                    value={borderColor}
                                    onChange={(e) => setBorderColor(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>透明度：{borderOpacity}%</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={borderOpacity}
                                onChange={(e) => setBorderOpacity(Number(e.target.value))}
                            />
                        </div>
                    </div>
                )

            case 'corner':
                return (
                    <div className="settings-form">
                        <div className="form-group">
                            <label>圆角方式</label>
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        checked={cornerMode === 'percent'}
                                        onChange={() => setCornerMode('percent')}
                                    />
                                    百分比
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        checked={cornerMode === 'pixel'}
                                        onChange={() => setCornerMode('pixel')}
                                    />
                                    像素
                                </label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>
                                圆角大小：{cornerRadius}{cornerMode === 'percent' ? '%' : 'px'}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max={cornerMode === 'percent' ? 50 : 200}
                                value={cornerRadius}
                                onChange={(e) => setCornerRadius(Number(e.target.value))}
                            />
                            {cornerMode === 'percent' && cornerRadius === 50 && (
                                <span className="range-hint">50% 将生成圆形</span>
                            )}
                        </div>
                    </div>
                )

            case 'merge-pdf':
                return (
                    <div className="settings-form">
                        <div className="form-group">
                            <label>页面适应方式</label>
                            <div className="radio-group">
                                <label>
                                    <input
                                        type="radio"
                                        checked={pdfFit === 'contain'}
                                        onChange={() => setPdfFit('contain')}
                                    />
                                    包含 (完整显示)
                                </label>
                                <label>
                                    <input
                                        type="radio"
                                        checked={pdfFit === 'fill'}
                                        onChange={() => setPdfFit('fill')}
                                    />
                                    填充 (充满页面)
                                </label>
                            </div>
                        </div>
                    </div>
                )

            case 'merge-image':
                return (
                    <div className="settings-form">
                        <div className="form-group">
                            <label>拼接方向</label>
                            <div className="flip-options">
                                <button
                                    className={`flip-btn ${mergeDirection === 'vertical' ? 'selected' : ''}`}
                                    onClick={() => setMergeDirection('vertical')}
                                >
                                    ↕️ 垂直拼接
                                </button>
                                <button
                                    className={`flip-btn ${mergeDirection === 'horizontal' ? 'selected' : ''}`}
                                    onClick={() => setMergeDirection('horizontal')}
                                >
                                    ↔️ 水平拼接
                                </button>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>间距 (px)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={mergeMargin}
                                    onChange={(e) => setMergeMargin(Number(e.target.value))}
                                />
                            </div>
                            <div className="form-group">
                                <label>背景颜色</label>
                                <input
                                    type="color"
                                    value={mergeColor}
                                    onChange={(e) => setMergeColor(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )

            case 'merge-gif':
                return (
                    <div className="settings-form">
                        <div className="form-group">
                            <label>每帧延迟 (毫秒)</label>
                            <input
                                type="number"
                                min="10"
                                step="10"
                                value={gifDelay}
                                onChange={(e) => setGifDelay(Number(e.target.value))}
                            />
                            <span className="range-hint">例如 500ms = 2帧/秒</span>
                        </div>
                        <div className="form-group">
                            <label>循环次数 (0 为无限)</label>
                            <input
                                type="number"
                                min="0"
                                value={gifLoop}
                                onChange={(e) => setGifLoop(Number(e.target.value))}
                            />
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    // 获取标题
    const getTitle = () => {
        const titles: Record<ProcessType, string> = {
            compress: '压缩设置',
            watermark: '水印设置',
            convert: '格式转换设置',
            resize: '尺寸调整设置',
            crop: '裁剪设置',
            rotate: '旋转设置',
            flip: '翻转设置',
            border: '边框设置',
            corner: '圆角设置',
            'merge-pdf': '合并 PDF 设置',
            'merge-image': '合并图片设置',
            'merge-gif': '合成 GIF 设置'
        }
        return titles[type]
    }

    return (
        <div className="settings-dialog-overlay">
            <div className="settings-dialog">
                <div className="dialog-header">
                    <h3>{getTitle()}</h3>
                    <button className="close-btn" onClick={onCancel}>×</button>
                </div>
                <div className="dialog-body">
                    {renderSettings()}
                </div>
                <div className="dialog-footer">
                    <button className="btn-secondary" onClick={onCancel}>取消</button>
                    <button className="btn-primary" onClick={handleConfirm}>确定</button>
                </div>
            </div>
        </div>
    )
}
