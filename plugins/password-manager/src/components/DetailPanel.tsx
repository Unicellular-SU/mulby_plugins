import { useState } from 'react'
import {
  X,
  Globe,
  User,
  Lock,
  Copy,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  ExternalLink,
} from 'lucide-react'
import { usePasswords } from '../context/PasswordContext'
import { copyToClipboard, getFaviconUrl } from '../utils/helpers'
import { analyzePassword, getStrengthLabel, getStrengthColor, getStrengthBgColor } from '../utils/strength'
import type { Account } from '../types'

interface DetailPanelProps {
  account: Account | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
  onFill: () => void
}

// 打开系统浏览器
function openInSystemBrowser(url: string) {
  const fullUrl = url.startsWith('http') ? url : `https://${url}`
  window.mulby?.shell?.openExternal?.(fullUrl)
}

export default function DetailPanel({ account, onClose, onDelete, onFill }: DetailPanelProps) {
  const { state, updateAccount, moveAccount } = usePasswords()
  
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Account>>({})

  // 密码强度分析
  const strength = account ? analyzePassword(account.password) : null

  // 复制处理
  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  // 开始编辑
  const startEdit = () => {
    if (account) {
      setEditData({
        name: account.name,
        username: account.username,
        website: account.website,
        remark: account.remark,
      })
      setIsEditing(true)
    }
  }

  // 保存编辑
  const saveEdit = async () => {
    if (account && editData.name) {
      await updateAccount(account.id, editData)
      setIsEditing(false)
    }
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditData({})
    setIsEditing(false)
  }

  // 获取显示的网址（去掉 http/https 前缀）
  const getDisplayUrl = (url: string) => url.replace(/^https?:\/\//, '')

  if (!account) {
    return null // 不渲染任何内容，点击密码时才显示
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          密码详情
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* 内容 - 独立滚动 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth">
        {/* 图标和名称 */}
        <div className="flex items-center gap-4">
          <div 
            className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            onClick={() => account.website && openInSystemBrowser(account.website)}
          >
            {account.website ? (
              <img
                src={getFaviconUrl(account.website)}
                alt=""
                className="w-8 h-8"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <Globe size={28} className="text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="名称"
              />
            ) : (
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                {account.name}
              </h4>
            )}
            {account.website && (
              <button
                onClick={() => account.website && openInSystemBrowser(account.website)}
                className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 mt-1 truncate"
              >
                <Globe size={14} />
                <span className="truncate">{getDisplayUrl(account.website)}</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        </div>

        {/* 用户名 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
            账号
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <User size={18} className="text-gray-400 shrink-0" />
              {isEditing ? (
                <input
                  type="text"
                  value={editData.username || ''}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white"
                  placeholder="账号"
                />
              ) : (
                <span className="flex-1 text-gray-900 dark:text-white font-medium truncate">
                  {account.username}
                </span>
              )}
            </div>
            <button
              onClick={() => handleCopy(account.username, 'username')}
              className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
              title="复制账号"
            >
              {copiedField === 'username' ? (
                <span className="text-sm text-green-500 font-medium">已复制</span>
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
        </div>

        {/* 密码 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
            密码
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Lock size={18} className="text-gray-400 shrink-0" />
              {isEditing ? (
                <input
                  type="text"
                  value={editData.website || ''}
                  onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white font-mono text-sm"
                  placeholder="网址（可选）"
                />
              ) : (
                <span className="flex-1 text-gray-900 dark:text-white font-mono text-sm truncate">
                  {showPassword ? account.password : '••••••••••••••••'}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
              title={showPassword ? '隐藏' : '显示'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              onClick={() => handleCopy(account.password, 'password')}
              className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
              title="复制密码"
            >
              {copiedField === 'password' ? (
                <span className="text-sm text-green-500 font-medium">已复制</span>
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>

          {/* 密码强度指示器 */}
          {strength && (
            <div className="flex items-center gap-3 px-1">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getStrengthBgColor(strength.strength)} transition-all duration-300`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
              <span className={`text-sm font-medium ${getStrengthColor(strength.strength)}`}>
                {getStrengthLabel(strength.strength)}
              </span>
            </div>
          )}
        </div>

        {/* 网址（编辑模式） */}
        {isEditing && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              网址
            </label>
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-gray-400 shrink-0" />
              <input
                type="url"
                value={editData.website || ''}
                onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://example.com"
              />
            </div>
          </div>
        )}

        {/* 备注 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
            备注
          </label>
          {isEditing ? (
            <textarea
              value={editData.remark || ''}
              onChange={(e) => setEditData({ ...editData, remark: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="添加备注..."
            />
          ) : (
            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
              {account.remark || '暂无备注'}
            </p>
          )}
        </div>

        {/* 分组信息 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
            分组
          </label>
          <select
            value={account.groupId}
            onChange={(e) => moveAccount(account.id, e.target.value)}
            disabled={isEditing}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {state.groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {/* 时间信息 */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
          <p className="text-xs text-gray-400">
            创建：{new Date(account.createdAt).toLocaleDateString('zh-CN')}
          </p>
          <p className="text-xs text-gray-400">
            修改：{new Date(account.updatedAt).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>

      {/* 底部操作按钮 - 固定 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2 shrink-0">
        {/* 自动填充按钮 */}
        <button
          onClick={onFill}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw size={18} />
          自动填充
        </button>

        {/* 编辑/保存 按钮 */}
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
            >
              <Save size={18} />
              保存
            </button>
            <button
              onClick={cancelEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
            >
              取消
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={startEdit}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
            >
              <Edit size={18} />
              编辑
            </button>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
