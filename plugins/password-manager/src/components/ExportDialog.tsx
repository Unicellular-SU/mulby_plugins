import { useState } from 'react'
import {
  X,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { usePasswords } from '../context/PasswordContext'
import { exportToCSV, exportToJSON } from '../services/importer'

interface ExportDialogProps {
  onClose: () => void
}

export default function ExportDialog({ onClose }: ExportDialogProps) {
  const { state } = usePasswords()
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')
  const [includePasswords, setIncludePasswords] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{ success: boolean; fileName?: string; error?: string } | null>(null)

  // 导出处理
  const handleExport = async () => {
    setIsExporting(true)
    setExportResult(null)

    try {
      let content: string
      let mimeType: string
      let extension: string

      if (exportFormat === 'csv') {
        content = exportToCSV(state.accounts, state.groups, { includePasswords })
        mimeType = 'text/csv;charset=utf-8;'
        extension = 'csv'
      } else {
        // JSON 格式
        content = exportToJSON(state.accounts, state.groups, { includePasswords })
        mimeType = 'application/json'
        extension = 'json'
      }

      // 创建 Blob 并下载
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `passwords-${new Date().toISOString().split('T')[0]}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportResult({ success: true, fileName: link.download })
    } catch (error) {
      setExportResult({ success: false, error: '导出失败，请重试' })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            导出密码
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-6">
          {/* 导出结果提示 */}
          {exportResult && (
            <div className={`p-4 rounded-lg border ${
              exportResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-3">
                {exportResult.success ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <AlertCircle size={20} className="text-red-500" />
                )}
                <span className={exportResult.success
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
                }>
                  {exportResult.success
                    ? `已导出 ${state.accounts.length} 条密码记录`
                    : exportResult.error
                  }
                </span>
              </div>
            </div>
          )}

          {/* 文件格式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              导出格式
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('csv')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  exportFormat === 'csv'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet size={24} className="mx-auto mb-2 text-green-500" />
                <p className="font-medium text-gray-900 dark:text-white text-center">CSV</p>
                <p className="text-xs text-gray-500 text-center mt-1">通用格式，可在 Excel 中打开</p>
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  exportFormat === 'json'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <FileSpreadsheet size={24} className="mx-auto mb-2 text-yellow-500" />
                <p className="font-medium text-gray-900 dark:text-white text-center">JSON</p>
                <p className="text-xs text-gray-500 text-center mt-1">结构化数据，便于程序处理</p>
              </button>
            </div>
          </div>

          {/* 导出内容选项 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              导出内容
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePasswords}
                  onChange={(e) => setIncludePasswords(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  包含密码明文
                </span>
              </label>
              <p className="text-xs text-gray-400 ml-7">
                取消勾选将导出脱敏数据（密码显示为 ****）
              </p>
            </div>
          </div>

          {/* 统计信息 */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {state.accounts.length}
                </p>
                <p className="text-sm text-gray-500">密码总数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {state.groups.length}
                </p>
                <p className="text-sm text-gray-500">分组数量</p>
              </div>
            </div>
          </div>

          {/* 警告 */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ 导出的文件包含敏感信息，请妥善保管，不要发送给任何人。
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || state.accounts.length === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors"
          >
            <Download size={18} />
            {isExporting ? '导出中...' : '导出'}
          </button>
        </div>
      </div>
    </div>
  )
}
