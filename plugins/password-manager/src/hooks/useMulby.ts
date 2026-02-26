import { useEffect, useState, useCallback } from 'react'

// Mulby API 类型定义
interface MulbyAPI {
  // 剪贴板
  clipboard: {
    writeText: (text: string) => Promise<boolean>
    readText: () => Promise<string>
  }
  // 通知
  notification: {
    show: (message: string) => void
    hide: () => void
  }
  // 文件系统
  fs: {
    readFile: (path: string) => Promise<{ content: string } | null>
    writeFile: (path: string, content: string) => Promise<void>
    deleteFile: (path: string) => Promise<void>
    exists: (path: string) => Promise<{ exists: boolean }>
  }
  // 主题
  theme: {
    get: () => Promise<'light' | 'dark'>
    set: (theme: 'light' | 'dark') => Promise<void>
  }
  // 自动填充
  fill: (data: { username: string; password: string }) => Promise<{ success: boolean }>
  // 事件监听
  onThemeChange: (callback: (theme: 'light' | 'dark') => void) => void
  onPluginInit: (callback: (data: any) => void) => void
  onCommand: (callback: (cmd: string, args: any) => any) => void
}

// 扩展 Window 接口
declare global {
  interface Window {
    mulby?: MulbyAPI
  }
}

interface UseMulbyOptions {
  pluginName: string
}

// 剪贴板 Hook
export function useClipboard() {
  const writeText = useCallback(async (text: string): Promise<boolean> => {
    try {
      if (window.mulby?.clipboard?.writeText) {
        return await window.mulby.clipboard.writeText(text)
      }
      // 降级方案
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }, [])

  const readText = useCallback(async (): Promise<string> => {
    try {
      if (window.mulby?.clipboard?.readText) {
        return await window.mulby.clipboard.readText()
      }
      return await navigator.clipboard.readText()
    } catch {
      return ''
    }
  }, [])

  return { writeText, readText }
}

// 通知 Hook
export function useNotification() {
  const show = useCallback((message: string) => {
    if (window.mulby?.notification?.show) {
      window.mulby.notification.show(message)
    } else {
      // 降级方案：使用 console
      console.log('[通知]', message)
    }
  }, [])

  const hide = useCallback(() => {
    if (window.mulby?.notification?.hide) {
      window.mulby.notification.hide()
    }
  }, [])

  return { show, hide }
}

// 主题 Hook
export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // 初始化主题
    const initTheme = async () => {
      if (window.mulby?.theme?.get) {
        const currentTheme = await window.mulby.theme.get()
        setThemeState(currentTheme)
        document.documentElement.classList.toggle('dark', currentTheme === 'dark')
      }
    }

    initTheme()

    // 监听主题变化
    window.mulby?.onThemeChange?.((newTheme) => {
      setThemeState(newTheme)
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    })
  }, [])

  const setTheme = useCallback(async (newTheme: 'light' | 'dark') => {
    if (window.mulby?.theme?.set) {
      await window.mulby.theme.set(newTheme)
    }
    setThemeState(newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }, [theme, setTheme])

  return { theme, setTheme, toggleTheme }
}

// 主 Hook
export function useMulby({ pluginName }: UseMulbyOptions) {
  const { writeText, readText } = useClipboard()
  const { show, hide } = useNotification()
  const { theme, setTheme, toggleTheme } = useTheme()

  // 初始化插件数据
  useEffect(() => {
    window.mulby?.onPluginInit?.((data) => {
      console.log(`[${pluginName}] 插件初始化数据:`, data)
    })
  }, [pluginName])

  return {
    pluginName,
    clipboard: { writeText, readText },
    notification: { show, hide },
    theme: { theme, setTheme, toggleTheme },
    fs: window.mulby?.fs,
    fill: window.mulby?.fill,
  }
}

export type { MulbyAPI }
