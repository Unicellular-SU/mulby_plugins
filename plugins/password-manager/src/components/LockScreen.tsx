import { useState, useEffect } from 'react'
import { Lock, Key, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { usePasswords } from '../context/PasswordContext'

type LockScreenMode = 'setup' | 'unlock' | 'change'

export default function LockScreen() {
  const { state, setupPassword, unlock, changePassword, resetAllData } = usePasswords()
  const [mode, setMode] = useState<LockScreenMode>('setup')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // 根据 lockState 同步 mode
  useEffect(() => {
    if (state.lockState === 'setup') {
      setMode('setup')
    } else if (state.lockState === 'locked') {
      setMode('unlock')
    }
  }, [state.lockState])

  const handleSetup = async () => {
    if (password.length === 0) {
      setError('请输入密码')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const success = await setupPassword(password)
      if (!success) {
        setError('设置失败，请重试')
      }
    } catch {
      setError('发生错误，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (password.length === 0) {
      setError('请输入密码')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const success = await unlock(password)
      if (!success) {
        setError('密码错误')
      }
    } catch {
      setError('解锁失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (oldPassword.length === 0) {
      setError('请输入旧密码')
      return
    }
    if (password.length === 0) {
      setError('请输入新密码')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }
    if (password === oldPassword) {
      setError('新密码不能与旧密码相同')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const success = await changePassword(oldPassword, password)
      if (!success) {
        setError('旧密码错误')
      } else {
        setMode('unlock')
        setPassword('')
        setOldPassword('')
        setConfirmPassword('')
      }
    } catch {
      setError('修改失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = async () => {
    if (window.confirm('确定要清除所有数据吗？此操作不可恢复！')) {
      await resetAllData()
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'setup':
        return '设置开门密码'
      case 'unlock':
        return '请输入密码解锁'
      case 'change':
        return '修改开门密码'
    }
  }

  const getSubtitle = () => {
    switch (mode) {
      case 'setup':
        return '设置一个密码来保护您的密码库'
      case 'unlock':
        return '输入密码访问您的密码库'
      case 'change':
        return '请先输入旧密码，然后设置新密码'
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-100 dark:bg-gray-900 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="w-full max-w-md min-h-[500px] flex flex-col justify-center">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500 text-white mb-3">
            <Lock size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            密码保险箱
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {getSubtitle()}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
            {getTitle()}
          </h2>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* 旧密码（修改密码时） */}
          {mode === 'change' && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                旧密码
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请输入旧密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          {/* 新密码 */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {mode === 'setup' ? '设置密码' : mode === 'change' ? '新密码' : '密码'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入密码"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* 确认密码（设置/修改时） */}
          {(mode === 'setup' || mode === 'change') && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="请再次输入密码"
                />
              </div>
            </div>
          )}

          {/* 确认按钮 */}
          <button
            onClick={
              mode === 'setup' ? handleSetup :
              mode === 'unlock' ? handleUnlock :
              handleChangePassword
            }
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? '处理中...' : (
              mode === 'setup' ? '确认设置' :
              mode === 'unlock' ? '解锁' :
              '确认修改'
            )}
          </button>

          {/* 忘记密码链接 */}
          {mode === 'unlock' && (
            <div className="mt-3 text-center">
              <button
                onClick={() => {
                  if (window.confirm('忘记密码将无法恢复任何数据！确定要清除所有数据吗？')) {
                    handleReset()
                  }
                }}
                className="text-sm text-red-500 hover:text-red-600"
              >
                忘记密码？清除所有数据
              </button>
            </div>
          )}

          {/* 切换到修改密码 */}
          {mode === 'unlock' && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setMode('change')
                  setError('')
                }}
                className="w-full text-sm text-blue-500 hover:text-blue-600"
              >
                修改开门密码
              </button>
            </div>
          )}

          {/* 返回（修改密码时） */}
          {mode === 'change' && (
            <div className="mt-3 text-center">
              <button
                onClick={() => {
                  setMode('unlock')
                  setPassword('')
                  setOldPassword('')
                  setConfirmPassword('')
                  setError('')
                }}
                className="text-sm text-gray-500 hover:text-gray-600"
              >
                返回
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-5">
          您的数据使用 AES-256-CBC 加密存储
        </p>
      </div>
    </div>
  )
}
