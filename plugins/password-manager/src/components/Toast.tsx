import { useEffect, useState, createContext, useContext } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

// Toast 类型
export type ToastType = 'success' | 'error' | 'info' | 'warning'

// Toast 配置
interface ToastConfig {
  id: string
  type: ToastType
  message: string
  duration?: number
}

// Toast 上下文
interface ToastContextType {
  show: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast 必须在 ToastProvider 内使用')
  }
  return context
}

// Toast 提供者
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastConfig[]>([])

  const show = (message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = `${Date.now()}-${Math.random()}`
    const toast: ToastConfig = { id, type, message, duration }
    
    setToasts(prev => [...prev, toast])

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />
      case 'warning':
        return <AlertCircle size={20} className="text-yellow-500" />
      case 'info':
        return <Info size={20} className="text-blue-500" />
    }
  }

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    }
  }

  const getTextColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'text-green-700 dark:text-green-300'
      case 'error':
        return 'text-red-700 dark:text-red-300'
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300'
      case 'info':
        return 'text-blue-700 dark:text-blue-300'
    }
  }

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      
      {/* Toast 容器 */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
              ${getBgColor(toast.type)}
              animate-slide-in-right
            `}
          >
            {getIcon(toast.type)}
            <span className={`text-sm font-medium ${getTextColor(toast.type)}`}>
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              <X size={14} className="text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Toast 组件（独立使用）
interface ToastProps {
  show: boolean
  onClose: () => void
  message: string
  type?: ToastType
}

export function Toast({ show, onClose, message, type = 'info' }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
        ${type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
        ${type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : ''}
        ${type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : ''}
        ${type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : ''}
      `}>
        {type === 'success' && <CheckCircle size={20} className="text-green-500" />}
        {type === 'error' && <AlertCircle size={20} className="text-red-500" />}
        {type === 'warning' && <AlertCircle size={20} className="text-yellow-500" />}
        {type === 'info' && <Info size={20} className="text-blue-500" />}
        <span className={`
          text-sm font-medium
          ${type === 'success' ? 'text-green-700 dark:text-green-300' : ''}
          ${type === 'error' ? 'text-red-700 dark:text-red-300' : ''}
          ${type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' : ''}
          ${type === 'info' ? 'text-blue-700 dark:text-blue-300' : ''}
        `}>
          {message}
        </span>
      </div>
    </div>
  )
}
