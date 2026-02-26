/**
 * 图片列表组件
 * 展示已选择的图片，支持删除和预览
 */

import { useState } from 'react'
import type { ImageInfo } from '../utils/types'

interface ImageListProps {
    images: ImageInfo[]
    onRemove: (index: number) => void
    onClear: () => void
    onAddImages: () => void
    onReorder: (fromIndex: number, toIndex: number) => void
}

export function ImageList({ images, onRemove, onClear, onAddImages, onReorder }: ImageListProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

    // 格式化文件大小
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '-'
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    }

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index)
        e.dataTransfer.effectAllowed = 'move'
        // 设置透明图像，避免默认的 ghost image 遮挡太严重 (可选)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        // 这里可以添加视觉反馈
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault()
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            onReorder(draggedIndex, targetIndex)
        }
        setDraggedIndex(null)
    }

    return (
        <div className="image-list">
            <div className="image-list-header">
                <span className="image-count">已选择 {images.length} 张图片</span>
                <div className="image-list-actions">
                    <button className="btn-text" onClick={onAddImages}>
                        + 添加
                    </button>
                    {images.length > 0 && (
                        <button className="btn-text btn-danger" onClick={onClear}>
                            清空
                        </button>
                    )}
                </div>
            </div>

            {images.length === 0 ? (
                <div className="empty-state" onClick={onAddImages}>
                    <div className="empty-icon">🖼️</div>
                    <p>点击添加图片或拖拽图片到此处</p>
                    <p className="empty-hint">支持 PNG、JPG、WebP、TIFF、AVIF 等格式</p>
                </div>
            ) : (
                <div className="image-grid">
                    {images.map((img, index) => (
                        <div
                            key={img.path}
                            className={`image-item ${draggedIndex === index ? 'dragging' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div className="image-preview">
                                <img src={`file://${img.path}`} alt={img.name} draggable={false} />
                                {hoveredIndex === index && (
                                    <button
                                        className="remove-btn"
                                        onClick={() => onRemove(index)}
                                        title="移除"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            <div className="image-info">
                                <span className="image-name" title={img.name}>
                                    {img.name}
                                </span>
                                <span className="image-meta">
                                    {img.width && img.height
                                        ? `${img.width}×${img.height}`
                                        : formatSize(img.size)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
