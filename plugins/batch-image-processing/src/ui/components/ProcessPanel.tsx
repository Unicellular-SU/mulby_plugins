/**
 * 处理功能面板
 * 展示 9 种图片处理功能的入口卡片
 */

import type { ProcessType } from '../utils/types'

interface ProcessPanelProps {
    selected: ProcessType | null
    onSelect: (type: ProcessType) => void
    disabled?: boolean
}

interface FeatureItem {
    type: ProcessType
    icon: string
    name: string
    desc: string
}

const features: FeatureItem[] = [
    { type: 'compress', icon: '📦', name: '批量压缩', desc: '减小图片文件大小' },
    { type: 'watermark', icon: '💧', name: '添加水印', desc: '文字/图片水印' },
    { type: 'convert', icon: '🔄', name: '格式转换', desc: '9种格式互转' },
    { type: 'resize', icon: '📐', name: '调整尺寸', desc: '固定/百分比' },
    { type: 'crop', icon: '✂️', name: '图片裁剪', desc: '按比例裁剪' },
    { type: 'rotate', icon: '🔃', name: '图片旋转', desc: '任意角度' },
    { type: 'flip', icon: '↔️', name: '图片翻转', desc: '镜像翻转' },
    { type: 'border', icon: '🔲', name: '添加边框', desc: '自定义边框' },
    { type: 'corner', icon: '⬡', name: '设置圆角', desc: '像素/百分比' },
    { type: 'merge-pdf', icon: '📄', name: '合并 PDF', desc: '合成一个 PDF' },
    { type: 'merge-image', icon: '🧩', name: '合并图片', desc: '长图拼接/拼图' },
    { type: 'merge-gif', icon: '🎞️', name: '合成 GIF', desc: '多图转动图' }
]

export function ProcessPanel({ selected, onSelect, disabled }: ProcessPanelProps) {
    return (
        <div className="process-panel">
            <h3 className="panel-title">选择处理功能</h3>
            <div className="feature-grid">
                {features.map((feature) => (
                    <button
                        key={feature.type}
                        className={`feature-card ${selected === feature.type ? 'selected' : ''}`}
                        onClick={() => onSelect(feature.type)}
                        disabled={disabled}
                    >
                        <span className="feature-icon">{feature.icon}</span>
                        <span className="feature-name">{feature.name}</span>
                        <span className="feature-desc">{feature.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
