import { useEffect, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Lock } from 'lucide-react'
import { PasswordProvider, usePasswords } from '../context/PasswordContext'
import { ToastProvider, useToast } from '../components/Toast'
import LockScreen from '../components/LockScreen'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import PasswordList from '../components/PasswordList'
import DetailPanel from '../components/DetailPanel'
import PasswordGenerator from '../components/PasswordGenerator'
import ImportDialog from '../components/ImportDialog'
import ExportDialog from '../components/ExportDialog'
import AddAccountDialog from '../components/AddAccountDialog'

// 主应用组件
function PasswordManager() {
  const { state, selectAccount, moveAccount, closeGenerator, deleteAccount } = usePasswords()
  const { show } = useToast()

  // 拖拽状态
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const [addAccountOpen, setAddAccountOpen] = useState(false)

  // 触摸传感器
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  // 获取当前选中的密码
  const selectedAccount = state.selectedAccountId
    ? state.accounts.find(a => a.id === state.selectedAccountId)
    : null

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      // 移动到其他分组
      moveAccount(active.id as string, over.id as string)
      show(`已将密码移动到目标分组`, 'success')
    }

    setActiveDragId(null)
    setDropTargetId(null)
  }

  // 拖拽经过分组
  const handleDragOver = (groupId: string | null) => {
    setDropTargetId(groupId)
  }

  // 拖放到分组
  const handleDrop = (accountId: string, targetGroupId: string) => {
    moveAccount(accountId, targetGroupId)
    show(`已将密码移动到目标分组`, 'success')
  }

  // 添加新密码
  const handleAddAccount = () => {
    setAddAccountOpen(true)
  }

  // 自动填充
  const handleAutoFill = async () => {
    if (!selectedAccount) return

    try {
      if (window.mulby?.input?.hideMainWindowPasteText) {
        const usernameSuccess = await window.mulby.input.hideMainWindowPasteText(selectedAccount.username)
        if (usernameSuccess) {
          await window.mulby.input.simulateKeyboardTap('Tab')
          await window.mulby.input.hideMainWindowPasteText(selectedAccount.password)
        }
        show('自动填充成功', 'success')
      } else if (window.mulby?.input?.hideMainWindowTypeString) {
        await window.mulby.input.hideMainWindowTypeString(selectedAccount.username)
        await window.mulby.input.simulateKeyboardTap('Tab')
        await window.mulby.input.hideMainWindowTypeString(selectedAccount.password)
        show('自动填充成功', 'success')
      } else {
        await navigator.clipboard.writeText(selectedAccount.password)
        show('已复制密码到剪贴板，请粘贴使用', 'info')
      }
    } catch {
      try {
        await navigator.clipboard.writeText(selectedAccount.password)
        show('已复制密码到剪贴板，请粘贴使用', 'info')
      } catch {
        show('自动填充失败', 'error')
      }
    }
  }

  // 删除密码
  const handleDeleteAccount = () => {
    if (!selectedAccount) return

    if (window.confirm(`确定要删除 "${selectedAccount.name}" 吗？`)) {
      deleteAccount(selectedAccount.id)
      show('密码已删除', 'success')
      selectAccount(null)
    }
  }

  // 渲染锁屏
  if (state.lockState !== 'unlocked' || !state.isInitialized) {
    return <LockScreen />
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* 插件容器 - 三栏布局 */}
      <div className="app">
        {/* 顶部栏 */}
        <Header onAddAccount={handleAddAccount} />

        {/* 主内容区 - 三栏 Flex 布局 */}
        <div className="main-content">
          {/* 左侧边栏 - 根据 sidebarOpen 显示/隐藏 */}
          {state.sidebarOpen && (
            <div className="sidebar-container sidebar-open">
              <Sidebar
                dropTargetId={dropTargetId}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            </div>
          )}

          {/* 中间密码列表 - 独立滚动 */}
          <div className="password-list-container">
            <PasswordList onAddAccount={handleAddAccount} />
          </div>

          {/* 右侧详情面板 - 悬浮固定显示 */}
          {selectedAccount && (
            <div className="detail-panel-container">
              <DetailPanel
                account={selectedAccount}
                onClose={() => selectAccount(null)}
                onEdit={() => {}}
                onDelete={handleDeleteAccount}
                onFill={handleAutoFill}
              />
            </div>
          )}
        </div>

        {/* 弹窗 */}
        {state.generatorOpen && (
          <PasswordGenerator onClose={closeGenerator} />
        )}

        {state.importOpen && (
          <ImportDialog onClose={() => {}} />
        )}

        {state.exportOpen && (
          <ExportDialog onClose={() => {}} />
        )}

        {addAccountOpen && (
          <AddAccountDialog onClose={() => setAddAccountOpen(false)} />
        )}
      </div>

      {/* 拖拽覆盖层 */}
      <DragOverlay>
        {activeDragId ? (
          <div className="opacity-80 rotate-3 scale-105">
            <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-500 shadow-lg p-4 w-64">
              <p className="font-medium text-gray-900 dark:text-white">
                {state.accounts.find(a => a.id === activeDragId)?.name}
              </p>
              <p className="text-sm text-gray-500">拖放到目标分组</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// 应用入口
export default function App() {
  const [isReady, setIsReady] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const initialTheme = (params.get('theme') as 'light' | 'dark') || 'light'
    setTheme(initialTheme)
    document.documentElement.classList.toggle('dark', initialTheme === 'dark')

    window.mulby?.onThemeChange?.((newTheme: 'light' | 'dark') => {
      setTheme(newTheme)
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
    })

    window.mulby?.onPluginInit?.((data: any) => {
      console.log('Plugin initialized:', data)
    })

    setIsReady(true)
  }, [])

  if (!isReady) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <PasswordProvider>
      <ToastProvider>
        <PasswordManager />
      </ToastProvider>
    </PasswordProvider>
  )
}
