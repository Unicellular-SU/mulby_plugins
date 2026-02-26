import { useState, useCallback } from 'react'
import {
  X,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react'
import { usePasswords } from '../context/PasswordContext'
import { parseCSV, isChromeFormat, importFromCSV } from '../services/importer'
import type { ImportConflictStrategy, ImportResult } from '../types'

interface ImportDialogProps {
  onClose: () => void
}

type ImportStep = 'upload' | 'preview' | 'result'

export default function ImportDialog({ onClose }: ImportDialogProps) {
  const { state, importFromCSV: performImport } = usePasswords()
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileContent, setFileContent] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [previewData, setPreviewData] = useState<any[]>([])
  const [strategy, setStrategy] = useState<ImportConflictStrategy>('skip')
  const [result, setResult] = useState<{ success: number; skipped: number; failed: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // 处理文件选择
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)

    try {
      const text = await file.text()
      setFileContent(text)

      // 解析预览数据
      const rows = parseCSV(text)
      
      if (!isChromeFormat(rows)) {
        setError('文件格式不匹配。请确保使用 Chrome 或 Edge 导出的 CSV 格式。')
        return
      }

      setPreviewData(rows.slice(0, 5)) // 只显示前5条预览
      setStep('preview')
      setError(null)
    } catch {
      setError('读取文件失败，请重试')
    }
  }, [])

  // 执行导入
  const handleImport = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // 调用导入服务
      const importResult = await performImport(fileContent, strategy)
      
      // 设置结果
      setResult({
        success: importResult.success,
        skipped: importResult.skipped,
        failed: importResult.failed,
      })
      setStep('result')
    } catch {
      setError('导入失败，请重试')
    } finally {
      setIsProcessing(false)
    }
  }

  // 重置
  const handleReset = () => {
    setStep('upload')
    setFileContent('')
    setFileName('')
    setPreviewData([])
    setResult(null)
    setError(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            导入密码
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center gap-2 py-4 border-b border-gray-200 dark:border-gray-700">
          {['上传文件', '预览确认', '导入结果'].map((label, index) => {
            const stepIndex = ['upload', 'preview', 'result'].indexOf(step)
            const isActive = index === stepIndex
            const isCompleted = index < stepIndex

            return (
              <React.Fragment key={label}>
                <div className="flex items-center gap-2">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${isActive ? 'bg-blue-500 text-white' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-200 dark:bg-gray-600 text-gray-500' : ''}
                  `}>
                    {isCompleted ? <CheckCircle size={16} /> : index + 1}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
                {index < 2 && (
                  <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 mx-2" />
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* 步骤 1: 上传文件 */}
          {step === 'upload' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileSpreadsheet size={40} className="text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                选择 CSV 文件
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                支持导入 Chrome 和 Edge 浏览器导出的密码 CSV 文件
              </p>

              <label className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg cursor-pointer transition-colors">
                <Upload size={20} />
                选择文件
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              <p className="mt-4 text-sm text-gray-400">
                文件格式: name, url, username, password, note
              </p>
            </div>
          )}

          {/* 步骤 2: 预览确认 */}
          {step === 'preview' && (
            <div className="space-y-6">
              {/* 文件信息 */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <FileSpreadsheet size={24} className="text-green-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {fileName}
                  </p>
                  <p className="text-sm text-gray-500">
                    共 {previewData.length} 条记录（显示前5条预览）
                  </p>
                </div>
              </div>

              {/* 预览表格 */}
              <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">名称</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">网址</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">账号</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">密码</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                    {previewData.map((row, index) => (
                      <tr key={index} className="bg-white dark:bg-gray-800">
                        <td className="px-4 py-2 text-gray-900 dark:text-white truncate max-w-[100px]">
                          {row.name}
                        </td>
                        <td className="px-4 py-2 text-gray-500 truncate max-w-[120px]">
                          {row.url}
                        </td>
                        <td className="px-4 py-2 text-gray-900 dark:text-white truncate max-w-[100px]">
                          {row.username}
                        </td>
                        <td className="px-4 py-2 text-gray-500 truncate max-w-[80px]">
                          ••••••••
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 冲突处理策略 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  遇到重复的密码如何处理？
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setStrategy('skip')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      strategy === 'skip'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-white">跳过</p>
                    <p className="text-xs text-gray-500 mt-1">保留原有数据</p>
                  </button>
                  <button
                    onClick={() => setStrategy('overwrite')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      strategy === 'overwrite'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-white">覆盖</p>
                    <p className="text-xs text-gray-500 mt-1">用新数据替换</p>
                  </button>
                  <button
                    onClick={() => setStrategy('merge')}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      strategy === 'merge'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-medium text-gray-900 dark:text-white">合并</p>
                    <p className="text-xs text-gray-500 mt-1">仅更新密码</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 步骤 3: 导入结果 */}
          {step === 'result' && result && (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                导入完成
              </h3>
              <div className="flex justify-center gap-8 mt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">{result.success}</p>
                  <p className="text-sm text-gray-500 mt-1">成功导入</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-500">{result.skipped}</p>
                  <p className="text-sm text-gray-500 mt-1">跳过</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">{result.failed}</p>
                  <p className="text-sm text-gray-500 mt-1">失败</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          {step === 'upload' && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
            >
              取消
            </button>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
              >
                重新选择
              </button>
              <button
                onClick={handleImport}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors"
              >
                {isProcessing ? '导入中...' : '确认导入'}
              </button>
            </>
          )}

          {step === 'result' && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
