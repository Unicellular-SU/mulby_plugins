/**
 * 图片批量处理主应用
 */

import { useEffect, useState, useCallback } from 'react'
import { ImageList } from './components/ImageList'
import { ProcessPanel } from './components/ProcessPanel'
import { SettingsDialog } from './components/SettingsDialog'
import { processImages, getImageInfo } from './utils/imageProcessor'
import type { ProcessType, ProcessConfig, ImageInfo, ProcessResult } from './utils/types'

interface Attachment {
  type: 'file' | 'image'
  path: string
  name?: string
}

interface PluginInitData {
  pluginName: string
  featureCode: string
  input: string
  mode?: string
  route?: string
  files?: string[]
  images?: string[]
  attachments?: Attachment[]
}

export default function App() {
  // 图片列表
  const [images, setImages] = useState<ImageInfo[]>([])
  // 选中的处理功能
  const [selectedType, setSelectedType] = useState<ProcessType | null>(null)
  // 是否显示设置对话框
  const [showSettings, setShowSettings] = useState(false)
  // 处理中状态
  const [processing, setProcessing] = useState(false)
  // 进度信息
  const [progress, setProgress] = useState({ current: 0, total: 0, file: '' })
  // 处理结果
  const [results, setResults] = useState<ProcessResult[]>([])
  // 是否显示结果
  const [showResults, setShowResults] = useState(false)

  // 添加图片
  const addImages = useCallback(async (paths: string[]) => {
    const newImages: ImageInfo[] = []
    for (const path of paths) {
      try {
        const info = await getImageInfo(path)
        // 避免重复添加
        if (!images.some(img => img.path === path)) {
          newImages.push(info)
        }
      } catch (error) {
        console.error('获取图片信息失败:', path, error)
      }
    }
    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages])
    }
  }, [images])

  // 处理插件初始化
  useEffect(() => {
    window.mulby?.onPluginInit?.((data: PluginInitData) => {
      console.log('[图片批量处理] 初始化数据:', data)

      // 收集所有图片路径
      const imagePaths: string[] = []

      // 从 attachments 获取图片
      if (data.attachments && data.attachments.length > 0) {
        for (const attachment of data.attachments) {
          if (attachment.path) {
            imagePaths.push(attachment.path)
          }
        }
      }

      // 兼容旧的 files/images 参数
      if (data.files && data.files.length > 0) {
        imagePaths.push(...data.files)
      }
      if (data.images && data.images.length > 0) {
        imagePaths.push(...data.images)
      }

      if (imagePaths.length > 0) {
        addImages(imagePaths)
      }
    })
  }, [addImages])

  // 处理拖拽
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const files = e.dataTransfer?.files
      if (files) {
        const paths: string[] = []
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          if (file.type.startsWith('image/')) {
            paths.push((file as any).path || file.name)
          }
        }
        if (paths.length > 0) {
          addImages(paths)
        }
      }
    }

    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('drop', handleDrop)
    }
  }, [addImages])

  // 打开文件选择对话框
  const handleAddImages = async () => {
    const files = await window.mulby.dialog.showOpenDialog({
      title: '选择图片',
      properties: ['openFile', 'multiSelections'],
      filters: [{
        name: '图片文件',
        extensions: ['png', 'jpg', 'jpeg', 'webp', 'tiff', 'avif', 'bmp', 'gif', 'ico', 'svg']
      }]
    })
    if (files.length > 0) {
      addImages(files)
    }
  }

  // 移除单张图片
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // 清空所有图片
  const handleClearImages = () => {
    setImages([])
    setResults([])
    setShowResults(false)
  }

  // 调整图片顺序
  const handleReorder = (fromIndex: number, toIndex: number) => {
    setImages(prev => {
      const newImages = [...prev]
      const [moved] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, moved)
      return newImages
    })
  }

  // 选择处理功能
  const handleSelectType = (type: ProcessType) => {
    if (images.length === 0) {
      window.mulby.notification.show('请先添加图片', 'warning')
      return
    }
    setSelectedType(type)
    setShowSettings(true)
  }

  // 确认配置并开始处理
  const handleConfirmSettings = async (config: ProcessConfig) => {
    setShowSettings(false)
    setProcessing(true)
    setShowResults(false)
    setResults([])

    try {
      // 获取系统临时目录并创建处理缓存目录
      const tempPath = await window.mulby.system.getPath('temp')
      const cacheDir = `${tempPath}/mulby-image-batch-${Date.now()}`
      await window.mulby.filesystem.mkdir(cacheDir)

      config.outputDir = cacheDir

      const imagePaths = images.map(img => img.path)
      const tempResults = await processImages(imagePaths, config, (current, total, file) => {
        setProgress({ current, total, file })
      })

      // 检查处理结果
      const successResults = tempResults.filter(r => r.success && r.outputPath)
      if (successResults.length === 0) {
        setResults(tempResults)
        setShowResults(true)
        window.mulby.notification.show('处理失败，没有成功处理的图片', 'error')
        // 清理临时目录
        try {
          await window.mulby.shell.trashItem(cacheDir)
        } catch { }
        setProcessing(false)
        return
      }

      // 弹框让用户选择保存方式
      const saveChoice = await window.mulby.dialog.showMessageBox({
        type: 'question',
        title: '选择保存方式',
        message: `已成功处理 ${successResults.length} 张图片，请选择保存方式：`,
        buttons: ['替换原图', '保存在原图同目录', '选择存储目录', '取消'],
        defaultId: 1,
        cancelId: 3
      })

      if (saveChoice.response === 3) {
        // 取消 - 清理临时目录
        window.mulby.notification.show('已取消保存', 'info')
        try {
          await window.mulby.shell.trashItem(cacheDir)
        } catch { }
        setProcessing(false)
        return
      }

      // 根据选择处理文件
      const finalResults: ProcessResult[] = []

      for (const result of tempResults) {
        if (!result.success || !result.outputPath) {
          finalResults.push(result)
          continue
        }

        try {
          let targetPath: string
          const tempFile = result.outputPath
          const sourcePath = result.sourcePath
          const sourceDir = sourcePath.split('/').slice(0, -1).join('/')
          const tempFileName = tempFile.split('/').pop() || ''

          if (saveChoice.response === 0) {
            // 替换原图 - 使用原图路径
            targetPath = sourcePath
          } else if (saveChoice.response === 1) {
            // 保存在原图同目录 - 使用处理后的文件名
            targetPath = `${sourceDir}/${tempFileName}`
          } else {
            // 选择存储目录
            const customDir = await window.mulby.dialog.showOpenDialog({
              title: '选择存储目录',
              properties: ['openDirectory']
            })

            if (customDir.length === 0) {
              // 用户取消选择，使用原图同目录
              targetPath = `${sourceDir}/${tempFileName}`
            } else {
              targetPath = `${customDir[0]}/${tempFileName}`
            }
          }

          // 移动文件到目标位置
          await window.mulby.filesystem.copy(tempFile, targetPath)

          finalResults.push({
            success: true,
            sourcePath: result.sourcePath,
            outputPath: targetPath
          })
        } catch (error) {
          finalResults.push({
            success: false,
            sourcePath: result.sourcePath,
            error: error instanceof Error ? error.message : '保存失败'
          })
        }
      }

      // 清理临时目录
      try {
        await window.mulby.shell.trashItem(cacheDir)
      } catch (e) {
        console.warn('清理临时目录失败:', e)
      }

      setResults(finalResults)
      setShowResults(true)

      // 统计结果
      const successCount = finalResults.filter(r => r.success).length
      const failCount = finalResults.length - successCount

      if (failCount === 0) {
        window.mulby.notification.show(`处理完成！成功 ${successCount} 张`, 'success')
      } else {
        window.mulby.notification.show(`处理完成：成功 ${successCount} 张，失败 ${failCount} 张`, 'warning')
      }
    } catch (error) {
      console.error('处理失败:', error)
      window.mulby.notification.show('处理失败: ' + (error instanceof Error ? error.message : '未知错误'), 'error')
    } finally {
      setProcessing(false)
    }
  }

  // 取消设置
  const handleCancelSettings = () => {
    setShowSettings(false)
    setSelectedType(null)
  }

  // 打开输出目录
  const handleOpenOutputDir = async () => {
    if (results.length > 0 && results[0].outputPath) {
      const dir = results[0].outputPath.split('/').slice(0, -1).join('/')
      await window.mulby.shell.openFolder(dir)
    }
  }

  return (
    <div className="app">
      <div className="titlebar">
        <span className="titlebar-title">图片批量处理</span>
      </div>

      <div className="main-container">
        {/* 左侧：图片列表 */}
        <div className="sidebar">
          <ImageList
            images={images}
            onRemove={handleRemoveImage}
            onClear={handleClearImages}
            onAddImages={handleAddImages}
            onReorder={handleReorder}
          />
        </div>

        {/* 右侧：功能面板和结果 */}
        <div className="content">
          <ProcessPanel
            selected={selectedType}
            onSelect={handleSelectType}
            disabled={processing}
          />

          {/* 处理进度 */}
          {processing && (
            <div className="progress-section">
              <div className="progress-info">
                <span>正在处理: {progress.current} / {progress.total}</span>
                <span className="progress-file">{progress.file.split('/').pop()}</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* 处理结果 */}
          {showResults && results.length > 0 && (
            <div className="results-section">
              <div className="results-header">
                <span>处理结果</span>
                <button className="btn-text" onClick={handleOpenOutputDir}>
                  打开输出目录
                </button>
              </div>
              <div className="results-list">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`result-item ${result.success ? 'success' : 'error'}`}
                  >
                    <span className="result-icon">
                      {result.success ? '✓' : '✗'}
                    </span>
                    <span className="result-name">
                      {result.sourcePath.split('/').pop()}
                    </span>
                    {!result.success && (
                      <span className="result-error">{result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 设置对话框 */}
      {showSettings && selectedType && (
        <SettingsDialog
          type={selectedType}
          onConfirm={handleConfirmSettings}
          onCancel={handleCancelSettings}
        />
      )}
    </div>
  )
}
