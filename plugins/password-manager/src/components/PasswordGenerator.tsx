import { useState, useEffect, useCallback } from 'react'
import {
  X,
  RefreshCw,
  Copy,
  Check,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react'
import { usePasswords } from '../context/PasswordContext'
import { copyToClipboard } from '../utils/helpers'
import type { PasswordGeneratorConfig } from '../types'
import { CHAR_SETS, UI_CONFIG } from '../utils/constants'

interface PasswordGeneratorProps {
  onClose: () => void
  onSelect?: (password: string) => void
}

export default function PasswordGenerator({ onClose, onSelect }: PasswordGeneratorProps) {
  const { state, setGeneratorConfig } = usePasswords()
  const [config, setConfig] = useState<PasswordGeneratorConfig>(state.generatorConfig)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [strength, setStrength] = useState<{ score: number; strength: 'weak' | 'medium' | 'strong' }>({ score: 0, strength: 'weak' })

  // 生成密码
  const generatePassword = useCallback(() => {
    let charset = ''
    
    if (config.includeUppercase) charset += CHAR_SETS.uppercase
    if (config.includeLowercase) charset += CHAR_SETS.lowercase
    if (config.includeNumbers) charset += CHAR_SETS.numbers
    if (config.includeSymbols) charset += CHAR_SETS.symbols
    
    // 排除相似字符
    if (config.excludeSimilar) {
      charset = charset.split('').filter(c => !CHAR_SETS.similar.includes(c)).join('')
    }

    if (!charset) {
      setGeneratedPassword('')
      return
    }

    let password = ''
    const array = new Uint32Array(config.length)
    window.crypto.getRandomValues(array)

    for (let i = 0; i < config.length; i++) {
      password += charset[array[i] % charset.length]
    }

    setGeneratedPassword(password)
    
    // 计算强度
    let score = 0
    if (config.includeUppercase) score += 15
    if (config.includeLowercase) score += 15
    if (config.includeNumbers) score += 20
    if (config.includeSymbols) score += 30
    score += Math.min(20, config.length * 2)
    
    const strengthValue = score < 40 ? 'weak' : score < 70 ? 'medium' : 'strong'
    setStrength({ score: Math.min(100, score), strength: strengthValue })
  }, [config])

  // 初始生成
  useEffect(() => {
    generatePassword()
  }, [generatePassword])

  // 复制密码
  const handleCopy = async () => {
    if (!generatedPassword) return
    
    const success = await copyToClipboard(generatedPassword)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 选择密码
  const handleSelect = () => {
    if (generatedPassword && onSelect) {
      onSelect(generatedPassword)
      onClose()
    }
  }

  // 更新配置
  const updateConfig = (updates: Partial<PasswordGeneratorConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
    setGeneratorConfig({ ...config, ...updates })
  }

  const getStrengthColor = (s: string) => {
    switch (s) {
      case 'weak': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'strong': return 'bg-green-500'
    }
  }

  const getStrengthLabel = (s: string) => {
    switch (s) {
      case 'weak': return '弱'
      case 'medium': return '中'
      case 'strong': return '强'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            密码生成器
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 space-y-4">
          {/* 生成的密码显示 */}
          <div className="relative">
            <div className="flex items-center gap-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
              <code className="flex-1 text-xl font-mono text-gray-900 dark:text-white break-all">
                {generatedPassword || '点击生成按钮创建密码'}
              </code>
              <button
                onClick={handleCopy}
                className={`p-2 rounded-lg transition-colors ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                }`}
                title="复制密码"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
              <button
                onClick={generatePassword}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                title="重新生成"
              >
                <RefreshCw size={18} />
              </button>
            </div>

            {/* 强度指示器 */}
            {generatedPassword && (
              <div className="mt-2 flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStrengthColor(strength.strength)} transition-all duration-300`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${
                  strength.strength === 'weak' ? 'text-red-500' :
                  strength.strength === 'medium' ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {getStrengthLabel(strength.strength)}
                </span>
              </div>
            )}
          </div>

          {/* 折叠设置 */}
          <div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <Settings size={16} />
              {showSettings ? '收起设置' : '显示设置'}
              <span className={`transform transition-transform ${showSettings ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>

            {showSettings && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-4">
                {/* 长度 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    密码长度: {config.length}
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="64"
                    value={config.length}
                    onChange={(e) => updateConfig({ length: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>8</span>
                    <span>64</span>
                  </div>
                </div>

                {/* 字符类型 */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    包含字符
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeUppercase}
                        onChange={(e) => updateConfig({ includeUppercase: e.target.checked })}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">大写字母 (A-Z)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeLowercase}
                        onChange={(e) => updateConfig({ includeLowercase: e.target.checked })}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">小写字母 (a-z)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeNumbers}
                        onChange={(e) => updateConfig({ includeNumbers: e.target.checked })}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">数字 (0-9)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeSymbols}
                        onChange={(e) => updateConfig({ includeSymbols: e.target.checked })}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">特殊符号 (!@#)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer col-span-2">
                      <input
                        type="checkbox"
                        checked={config.excludeSimilar}
                        onChange={(e) => updateConfig({ excludeSimilar: e.target.checked })}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-300">排除相似字符 (I, l, 1, O, 0)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
          >
            关闭
          </button>
          {onSelect && (
            <button
              onClick={handleSelect}
              disabled={!generatedPassword}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors"
            >
              使用此密码
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
